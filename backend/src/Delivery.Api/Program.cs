using System.Text;
using Delivery.Api.Hubs;
using Delivery.Api.Middlewares;
using Delivery.Api.Multitenancy;
using Delivery.Api.Realtime;
using Delivery.Core.Contracts.Realtime;
using Delivery.Core.Domain.Common;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features;
using Delivery.Features.Common.Endpoints;
using Delivery.Features.Common.Security;
using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using StackExchange.Redis;

LoadDotEnvFromAncestors();

var builder = WebApplication.CreateBuilder(args);

// 1. Configuración de Base de Datos PostgreSQL con NetTopologySuite (PostGIS)
// Prioridad: Variable inyectada por Docker (ConnectionStrings__DefaultConnection) -> Composición desde variables .env
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(connectionString))
{
    var pgHost = Environment.GetEnvironmentVariable("POSTGRES_HOST") ?? "localhost";
    var pgPort = Environment.GetEnvironmentVariable("POSTGRES_PORT") ?? "5432";
    var pgDb = Environment.GetEnvironmentVariable("POSTGRES_DB") ?? "delivery";
    var pgUser = Environment.GetEnvironmentVariable("POSTGRES_USER") ?? "postgres";
    var pgPass = Environment.GetEnvironmentVariable("POSTGRES_PASSWORD")
        ?? throw new InvalidOperationException("La variable 'POSTGRES_PASSWORD' no está configurada en el archivo .env.");

    connectionString = $"Host={pgHost};Port={pgPort};Database={pgDb};Username={pgUser};Password={pgPass}";
}

builder.Services.AddScoped<TenantContext>();
builder.Services.AddScoped<ITenantContext>(sp => sp.GetRequiredService<TenantContext>());

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.UseNetTopologySuite();
        npgsqlOptions.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName);
        npgsqlOptions.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);
    });
});

// 2. Configuración de Redis (Caché, Idempotencia y GEO tracking)
var redisConnectionString = builder.Configuration.GetConnectionString("Redis");
if (string.IsNullOrWhiteSpace(redisConnectionString))
{
    var redisHost = Environment.GetEnvironmentVariable("REDIS_HOST") ?? "localhost";
    var redisPort = Environment.GetEnvironmentVariable("REDIS_PORT") ?? "6379";
    var redisPass = Environment.GetEnvironmentVariable("REDIS_PASSWORD")
        ?? throw new InvalidOperationException("La variable 'REDIS_PASSWORD' no está configurada en el archivo .env.");

    redisConnectionString = $"{redisHost}:{redisPort},password={redisPass},abortConnect=false";
}
builder.Services.AddSingleton<IConnectionMultiplexer>(_ => ConnectionMultiplexer.Connect(redisConnectionString));

// 3. Inyección de dependencias de Vertical Slices
builder.Services.AddDeliveryFeatures();

// 4. Configuración de Autenticación JWT y RBAC
var jwtSection = builder.Configuration.GetSection(JwtOptions.SectionName);
builder.Services.Configure<JwtOptions>(jwtSection);
var jwtOptions = jwtSection.Get<JwtOptions>() ?? new JwtOptions();

if (string.IsNullOrWhiteSpace(jwtOptions.SecretKey))
{
    jwtOptions.SecretKey = Environment.GetEnvironmentVariable("JWT_SECRET")
        ?? throw new InvalidOperationException("La variable 'JWT_SECRET' no está configurada en el archivo .env.");
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;
        options.SaveToken = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtOptions.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SecretKey)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("SuperAdminOnly", p => p.RequireRole("SuperAdmin"));
    options.AddPolicy("TenantAdminOnly", p => p.RequireRole("TenantAdmin", "SuperAdmin"));
    options.AddPolicy("BranchStaffOnly", p => p.RequireRole("BranchManager", "Cashier", "KitchenStaff", "TenantAdmin", "SuperAdmin"));
    options.AddPolicy("KitchenOnly", p => p.RequireRole("KitchenStaff", "BranchManager", "TenantAdmin", "SuperAdmin"));
    options.AddPolicy("CashierOnly", p => p.RequireRole("Cashier", "BranchManager", "TenantAdmin", "SuperAdmin"));
    options.AddPolicy("DriverOnly", p => p.RequireRole("Driver", "SuperAdmin"));
    options.AddPolicy("OperationalStaffOnly", p => p.RequireRole("SuperAdmin", "TenantAdmin", "BranchManager", "Cashier", "KitchenStaff", "Driver"));
});

// 5. Configuración de Tiempo Real (SignalR) y Notificadores Desacoplados
builder.Services.AddSignalR();
builder.Services.AddScoped<IKitchenNotifier, SignalRKitchenNotifier>();
builder.Services.AddScoped<ITrackingNotifier, SignalRTrackingNotifier>();

// 6. Configuración de Tareas en Segundo Plano (Hangfire)
builder.Services.AddHangfire(config =>
    config.UsePostgreSqlStorage(c => c.UseNpgsqlConnection(connectionString))
);
builder.Services.AddHangfireServer(options =>
{
    options.Queues = ["invoicing", "notifications", "default"];
});

// 7. Configuración de CORS para cliente Next.js
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:3005", "http://127.0.0.1:3005", "https://pedidos.delivery.com"];

var platformDomain = Environment.GetEnvironmentVariable("NEXT_PUBLIC_PLATFORM_DOMAIN")
    ?? Environment.GetEnvironmentVariable("PLATFORM_DOMAIN")
    ?? "mesafy.doicela.dev";

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
        {
            if (string.IsNullOrWhiteSpace(origin)) return false;
            if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri)) return false;
            var host = uri.Host;

            // 1. Orígenes locales de desarrollo y pruebas
            if (host.Equals("localhost", StringComparison.OrdinalIgnoreCase) ||
                host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            // 2. Orígenes explícitamente configurados en Cors:AllowedOrigins
            if (allowedOrigins.Any(ao => string.Equals(ao, origin, StringComparison.OrdinalIgnoreCase)))
            {
                return true;
            }

            // 3. Orígenes de producción bajo el dominio raíz de la plataforma o sus subdominios
            if (host.Equals(platformDomain, StringComparison.OrdinalIgnoreCase) ||
                host.EndsWith("." + platformDomain, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            return false;
        })
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Mesafy API", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Encabezado de autorización JWT. Ejemplo: 'Bearer {token}'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Inicialización de base de datos y seeding
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await context.Database.MigrateAsync();
    await DatabaseSeeder.SeedAsync(context);
}

// Pipeline HTTP
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseMiddleware<TenantResolutionMiddleware>();
app.UseAuthorization();
app.UseMiddleware<IdempotencyMiddleware>();

// Dashboard de Hangfire para auditoría de tareas en segundo plano (restringido a Development por seguridad)
if (app.Environment.IsDevelopment())
{
    app.UseHangfireDashboard("/hangfire", new DashboardOptions
    {
        DashboardTitle = "Delivery - Background Jobs Monitor (Dev)"
    });
}

// Health Check
app.MapGet("/health", () => Results.Ok(new
{
    status = "Healthy",
    service = "Delivery.Api",
    timestamp = DateTime.UtcNow
})).WithTags("System");

// Mapeo Descentralizado y Automático de Endpoints (Vertical Slices)
app.MapEndpoints();

// Mapeo de concentradores SignalR
app.MapHub<KitchenHub>("/hubs/kitchen");
app.MapHub<TrackingHub>("/hubs/tracking");

app.Run();

// ==============================================================================
// Única Fuente de la Verdad: Cargador automático del archivo .env canónico de la raíz
// ==============================================================================
static void LoadDotEnvFromAncestors()
{
    try
    {
        var dir = new DirectoryInfo(Directory.GetCurrentDirectory());
        while (dir != null)
        {
            var candidate = Path.Combine(dir.FullName, ".env");
            if (File.Exists(candidate))
            {
                foreach (var line in File.ReadAllLines(candidate))
                {
                    var trimmed = line.Trim();
                    if (string.IsNullOrEmpty(trimmed) || trimmed.StartsWith('#') || !trimmed.Contains('='))
                        continue;

                    var idx = trimmed.IndexOf('=');
                    var key = trimmed[..idx].Trim();
                    var val = trimmed[(idx + 1)..].Trim();

                    if ((val.StartsWith('"') && val.EndsWith('"') && val.Length >= 2) ||
                        (val.StartsWith('\'') && val.EndsWith('\'') && val.Length >= 2))
                    {
                        val = val[1..^1];
                    }

                    // Preserva variables ya inyectadas por el sistema operativo o Docker
                    if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable(key)))
                    {
                        Environment.SetEnvironmentVariable(key, val);
                    }
                }
                break;
            }
            dir = dir.Parent;
        }
    }
    catch
    {
        // En entornos de despliegue donde no exista el archivo en disco, omite de forma defensiva
    }
}
