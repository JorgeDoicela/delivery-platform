using Delivery.Features.Common.Endpoints;
using Delivery.Api.Hubs;
using Delivery.Api.Middlewares;
using Delivery.Api.Realtime;
using Delivery.Core.Contracts.Realtime;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features;
using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

// 1. Configuración de Base de Datos PostgreSQL con NetTopologySuite (PostGIS)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Cadena de conexión 'DefaultConnection' no encontrada.");

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.UseNetTopologySuite();
        npgsqlOptions.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName);
    });
});

// 2. Configuración de Redis (Caché, Idempotencia y GEO tracking)
var redisConnectionString = builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379";
builder.Services.AddSingleton<IConnectionMultiplexer>(_ => ConnectionMultiplexer.Connect(redisConnectionString));

// 3. Inyección de dependencias de Vertical Slices
builder.Services.AddDeliveryFeatures();

// 4. Configuración de Tiempo Real (SignalR) y Notificadores Desacoplados
builder.Services.AddSignalR();
builder.Services.AddScoped<IKitchenNotifier, SignalRKitchenNotifier>();
builder.Services.AddScoped<ITrackingNotifier, SignalRTrackingNotifier>();

// 5. Configuración de Tareas en Segundo Plano (Hangfire)
builder.Services.AddHangfire(config =>
    config.UsePostgreSqlStorage(c => c.UseNpgsqlConnection(connectionString))
);
builder.Services.AddHangfireServer(options =>
{
    options.Queues = ["invoicing", "notifications", "default"];
});

// 6. Configuración de CORS para cliente Next.js
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:3005", "http://127.0.0.1:3005", "https://pedidos.delivery.com"];

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

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
