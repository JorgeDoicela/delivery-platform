using Delivery.Api.Hubs;
using Delivery.Api.Middlewares;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features;
using Delivery.Features.Catalog.GetActiveMenu;
using Delivery.Features.Catalog.ToggleProductStatus;
using Delivery.Features.Geofencing.ResolveBranchByPoint;
using Delivery.Features.Kitchen.GetActiveKitchenOrders;
using Delivery.Features.Orders.ApproveTransferOrder;
using Delivery.Features.Orders.CreateOrder;
using Delivery.Features.Orders.GetOrderById;
using Delivery.Features.Orders.UpdateOrderStatus;
using Delivery.Features.Tracking.GetDriverLocation;
using Delivery.Features.Tracking.IngestDriverLocation;
using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.AspNetCore.SignalR;
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

// 4. Configuración de Tiempo Real (SignalR)
builder.Services.AddSignalR();

// 5. Configuración de Tareas en Segundo Plano (Hangfire)
builder.Services.AddHangfire(config =>
    config.UsePostgreSqlStorage(c => c.UseNpgsqlConnection(connectionString))
);
builder.Services.AddHangfireServer(options =>
{
    options.Queues = ["invoicing", "notifications", "default"];
});

// 6. Configuración de CORS para cliente Next.js
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
            "http://localhost:3005",
            "http://127.0.0.1:3005",
            "https://pedidos.delivery.com"
        )
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

// Dashboard de Hangfire para auditoría de tareas en segundo plano
app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    DashboardTitle = "Delivery - Background Jobs Monitor"
});

// ==========================================
// Rutas de API REST (Endpoints Vertical Slices)
// ==========================================

// Health Check
app.MapGet("/health", () => Results.Ok(new
{
    status = "Healthy",
    service = "Delivery.Api",
    timestamp = DateTime.UtcNow
})).WithTags("System");

// 1. Geofencing: Resolución espacial de sucursal
app.MapPost("/api/geofencing/resolve", async (ResolveBranchQuery query, ResolveBranchHandler handler, CancellationToken ct) =>
{
    var result = await handler.Handle(query, ct);
    return result.IsSuccess ? Results.Ok(result.Value) : Results.UnprocessableEntity(result.Error);
}).WithTags("Geofencing");

app.MapGet("/api/branches/{branchId:int}/capacity", async (int branchId, Delivery.Features.Orders.GetBranchCapacity.GetBranchCapacityHandler handler, CancellationToken ct) =>
{
    var result = await handler.Handle(new Delivery.Features.Orders.GetBranchCapacity.GetBranchCapacityQuery(branchId), ct);
    return result.IsSuccess ? Results.Ok(result.Value) : Results.NotFound(result.Error);
}).WithTags("Branches");

// 2. Catálogo: Menú activo y conmutación de stock
app.MapGet("/api/catalog/menu", async (GetActiveMenuHandler handler, CancellationToken ct) =>
{
    var result = await handler.Handle(new GetActiveMenuQuery(), ct);
    return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
}).WithTags("Catalog");

app.MapPut("/api/catalog/products/{id:int}/status", async (int id, ToggleProductStatusCommand command, ToggleProductStatusHandler handler, IHubContext<KitchenHub, IKitchenClient> kitchenHub, CancellationToken ct) =>
{
    if (id != command.ProductId) return Results.BadRequest("El ID de la ruta no coincide con el payload.");
    var result = await handler.Handle(command, ct);
    if (result.IsSuccess)
    {
        await kitchenHub.Clients.All.StockUpdated(result.Value.ProductId, result.Value.IsActive);
        return Results.Ok(result.Value);
    }
    return Results.BadRequest(result.Error);
}).WithTags("Catalog");

// 3. Órdenes: Creación, consulta y actualización de estados
app.MapPost("/api/orders", async (CreateOrderCommand command, CreateOrderHandler handler, IHubContext<KitchenHub, IKitchenClient> kitchenHub, CancellationToken ct) =>
{
    var result = await handler.Handle(command, ct);
    if (!result.IsSuccess) return Results.BadRequest(result.Error);

    // Notificar al KDS de la sucursal correspondiente vía SignalR con el ticket completo
    if (result.Value.Ticket is not null)
    {
        await kitchenHub.Clients.Group($"kitchen_branch_{command.BranchId}").ReceiveNewOrder(result.Value.Ticket);
    }
    else
    {
        await kitchenHub.Clients.Group($"kitchen_branch_{command.BranchId}").ReceiveNewOrder(result.Value);
    }

    return Results.Created($"/api/orders/{result.Value.OrderId}", result.Value);
}).WithTags("Orders");

app.MapGet("/api/orders/{id:guid}", async (Guid id, GetOrderByIdHandler handler, CancellationToken ct) =>
{
    var result = await handler.Handle(new GetOrderByIdQuery(id), ct);
    return result.IsSuccess ? Results.Ok(result.Value) : Results.NotFound(result.Error);
}).WithTags("Orders");

app.MapPut("/api/orders/{id:guid}/status", async (Guid id, UpdateOrderStatusCommand command, UpdateOrderStatusHandler handler, IHubContext<TrackingHub, ITrackingClient> trackingHub, IHubContext<KitchenHub, IKitchenClient> kitchenHub, CancellationToken ct) =>
{
    if (id != command.OrderId) return Results.BadRequest("El ID de la ruta no coincide con el payload.");
    var result = await handler.Handle(command, ct);
    if (!result.IsSuccess) return Results.BadRequest(result.Error);

    // Notificar al canal del cliente vía SignalR sobre el cambio de estado
    await trackingHub.Clients.Group($"order_tracking_{id}").OrderStatusChanged(result.Value.CurrentStatus.ToString());

    // Notificar a las pantallas KDS de cocina sobre la transición de estado
    await kitchenHub.Clients.All.OrderStatusChanged(id.ToString(), result.Value.CurrentStatus.ToString());

    return Results.Ok(result.Value);
}).WithTags("Orders");

app.MapPost("/api/orders/{id:guid}/transfer-approval", async (Guid id, ApproveTransferCommand command, ApproveTransferOrderHandler handler, IHubContext<KitchenHub, IKitchenClient> kitchenHub, CancellationToken ct) =>
{
    if (id != command.OrderId) return Results.BadRequest("El ID de la ruta no coincide con el payload.");
    var result = await handler.Handle(command, ct);
    if (result.IsSuccess && command.IsApproved)
    {
        await kitchenHub.Clients.All.OrderStatusChanged(id.ToString(), Delivery.Core.Domain.Enums.OrderStatus.Confirmed.ToString());
    }
    return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
}).WithTags("Orders");

// 4. Cocina (KDS): Listado de comandas activas
app.MapGet("/api/kitchen/branches/{branchId:int}/orders", async (int branchId, GetActiveKitchenOrdersHandler handler, CancellationToken ct) =>
{
    var result = await handler.Handle(new GetActiveKitchenOrdersQuery(branchId), ct);
    return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
}).WithTags("Kitchen");

// 5. Tracking: Ingesta y consulta de geolocalización de repartidores
app.MapPost("/api/tracking/driver-location", async (IngestDriverLocationCommand command, IngestDriverLocationHandler handler, IHubContext<TrackingHub, ITrackingClient> trackingHub, CancellationToken ct) =>
{
    var result = await handler.Handle(command, ct);
    if (!result.IsSuccess) return Results.BadRequest(result.Error);

    // Transmitir inmediatamente la coordenada por WebSockets al cliente que está viendo el mapa en vivo
    await trackingHub.Clients.Group($"order_tracking_{command.OrderId}")
        .ReceiveDriverLocation(command.Latitude, command.Longitude, command.Heading);

    return Results.Ok(result.Value);
}).WithTags("Tracking");

app.MapGet("/api/tracking/orders/{orderId:guid}/driver-location", async (Guid orderId, GetDriverLocationHandler handler, CancellationToken ct) =>
{
    var result = await handler.Handle(new GetDriverLocationQuery(orderId), ct);
    return result.IsSuccess ? Results.Ok(result.Value) : Results.NotFound(result.Error);
}).WithTags("Tracking");

// Mapeo de concentradores SignalR
app.MapHub<KitchenHub>("/hubs/kitchen");
app.MapHub<TrackingHub>("/hubs/tracking");

app.Run();
