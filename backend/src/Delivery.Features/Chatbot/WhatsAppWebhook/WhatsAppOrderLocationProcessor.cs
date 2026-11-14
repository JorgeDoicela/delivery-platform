using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Delivery.Core.Common.Spatial;
using Delivery.Core.Contracts.Realtime;
using Delivery.Core.Domain.Entities;
using Delivery.Core.Domain.Enums;
using Delivery.Core.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NetTopologySuite.Geometries;
using StackExchange.Redis;
using Order = Delivery.Core.Domain.Entities.Order;

namespace Delivery.Features.Chatbot.WhatsAppWebhook;

public partial class WhatsAppOrderLocationProcessor : IWhatsAppOrderLocationProcessor
{
    private static readonly GeometryFactory GeometryFactory = new(new PrecisionModel(), 4326);

    private readonly AppDbContext _db;
    private readonly IConnectionMultiplexer? _redis;
    private readonly ITenantKnowledgeProvider _knowledgeProvider;
    private readonly IConversationStore _conversationStore;
    private readonly ITrackingNotifier _trackingNotifier;
    private readonly IKitchenNotifier _kitchenNotifier;
    private readonly IWhatsAppClient _whatsAppClient;
    private readonly WhatsAppChatbotOptions _options;
    private readonly ILogger<WhatsAppOrderLocationProcessor> _logger;

    public WhatsAppOrderLocationProcessor(
        AppDbContext db,
        ITenantKnowledgeProvider knowledgeProvider,
        IConversationStore conversationStore,
        ITrackingNotifier trackingNotifier,
        IKitchenNotifier kitchenNotifier,
        IWhatsAppClient whatsAppClient,
        IOptions<WhatsAppChatbotOptions> options,
        ILogger<WhatsAppOrderLocationProcessor> logger,
        IConnectionMultiplexer? redis = null)
    {
        _db = db;
        _knowledgeProvider = knowledgeProvider;
        _conversationStore = conversationStore;
        _trackingNotifier = trackingNotifier;
        _kitchenNotifier = kitchenNotifier;
        _whatsAppClient = whatsAppClient;
        _options = options.Value;
        _logger = logger;
        _redis = redis;
    }

    public async Task<bool> HandleLocationAsync(
        WhatsAppIncomingMessage incoming,
        WhatsAppExtractedLocation location,
        string phoneId,
        string? contactName,
        CancellationToken ct = default)
    {
        var senderPhone = incoming.From;
        if (string.IsNullOrWhiteSpace(senderPhone)) return false;

        LogLocationProcessingStarted(_logger, senderPhone, location.Latitude, location.Longitude, location.IsLiveLocation);

        var cleanPhone = senderPhone.Replace("+", "").Trim();
        var searchDigits = cleanPhone.Length >= 8 ? cleanPhone[^8..] : cleanPhone;
        var userText = incoming.Text?.Body ?? string.Empty;

        // 1. Resolución de Tenant en contexto conversacional
        var sessionTenantId = await _conversationStore.GetActiveTenantSessionAsync(senderPhone, ct);
        var tenantContext = await _knowledgeProvider.ResolveContextAsync(phoneId, userText, senderPhone, sessionTenantId, ct);
        var tenant = tenantContext.Tenant;

        // 2. Extracción de número de orden si fue especificado explícitamente en el texto
        int? specifiedOrderNumber = null;
        var orderMatch = OrderNumberRegex().Match(userText);
        if (orderMatch.Success && int.TryParse(orderMatch.Groups[1].Value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsedNumber))
        {
            specifiedOrderNumber = parsedNumber;
        }

        var activeStatuses = new[]
        {
            OrderStatus.Created,
            OrderStatus.PendingValidation,
            OrderStatus.Confirmed,
            OrderStatus.InKitchen,
            OrderStatus.ReadyForDelivery,
            OrderStatus.OnTheWay
        };

        Order? order = null;

        // 3. Resolución determinista del pedido
        if (specifiedOrderNumber.HasValue)
        {
            order = await _db.Orders
                .IgnoreQueryFilters()
                .Include(o => o.Branch)
                .Include(o => o.Tenant)
                .FirstOrDefaultAsync(o => o.TenantId == tenant.Id && o.OrderNumber == specifiedOrderNumber.Value, ct);

            order ??= await _db.Orders
                .IgnoreQueryFilters()
                .Include(o => o.Branch)
                .Include(o => o.Tenant)
                .FirstOrDefaultAsync(o => o.OrderNumber == specifiedOrderNumber.Value, ct);
        }

        if (order == null)
        {
            // Buscar comanda activa del comensal en el tenant resuelto
            order = await _db.Orders
                .IgnoreQueryFilters()
                .Include(o => o.Branch)
                .Include(o => o.Tenant)
                .Where(o => o.TenantId == tenant.Id &&
                            o.CustomerPhone.Contains(searchDigits) &&
                            activeStatuses.Contains(o.Status))
                .OrderByDescending(o => o.CreatedAt)
                .FirstOrDefaultAsync(ct);
        }

        if (order == null)
        {
            // Buscar comanda activa en cualquier tenant de la plataforma
            order = await _db.Orders
                .IgnoreQueryFilters()
                .Include(o => o.Branch)
                .Include(o => o.Tenant)
                .Where(o => o.CustomerPhone.Contains(searchDigits) &&
                            activeStatuses.Contains(o.Status))
                .OrderByDescending(o => o.CreatedAt)
                .FirstOrDefaultAsync(ct);
        }

        if (order == null)
        {
            // Buscar la orden más reciente en las últimas 24 horas aunque no esté activa
            order = await _db.Orders
                .IgnoreQueryFilters()
                .Include(o => o.Branch)
                .Include(o => o.Tenant)
                .Where(o => o.CustomerPhone.Contains(searchDigits) &&
                            o.CreatedAt >= DateTime.UtcNow.AddHours(-24))
                .OrderByDescending(o => o.CreatedAt)
                .FirstOrDefaultAsync(ct);
        }

        var effectiveTenant = order?.Tenant ?? tenant;
        var clientPoint = GeometryFactory.CreatePoint(new Coordinate(location.Longitude, location.Latitude));

        // 4. Caso A: Se encontró una orden del comensal
        if (order != null)
        {
            // Si la orden ya culminó su ciclo (entregada o cancelada)
            if (order.Status == OrderStatus.Delivered || order.Status == OrderStatus.Cancelled)
            {
                await SaveCustomerDefaultLocationAsync(effectiveTenant.Id, senderPhone, contactName, clientPoint, location.Address, ct);

                var statusName = order.Status == OrderStatus.Delivered ? "entregado" : "cancelado";
                var closedOrderReply = $"Hola{FormatContactName(contactName)}. Tu Pedido #{order.OrderNumber} ya se encuentra {statusName}. " +
                    $"Hemos guardado tu ubicación para tu siguiente pedido a domicilio en '{effectiveTenant.Name}'.\n\n" +
                    $"Si deseas realizar una nueva orden, visita nuestro menú oficial:\nhttps://{_options.PlatformDomain}/{effectiveTenant.Slug}/menu";

                await _whatsAppClient.SendTextMessageAsync(senderPhone, closedOrderReply, phoneId, ct);
                return true;
            }

            // Evaluar cobertura espacial PostGIS en las sucursales del tenant
            var activeBranches = await _db.Branches
                .IgnoreQueryFilters()
                .Where(b => b.TenantId == effectiveTenant.Id && b.IsActive)
                .ToListAsync(ct);

            var evaluatedBranches = activeBranches.Select(b =>
            {
                var distanceKm = HaversineCalculator.CalculateDistanceKm(
                    b.LocationPoint.Y, b.LocationPoint.X, location.Latitude, location.Longitude);

                var insidePolygon = b.CoveragePolygon != null && b.CoveragePolygon.Contains(clientPoint);
                var insideRadius = b.DeliveryRadiusKm.HasValue && b.DeliveryRadiusKm.Value > 0
                    ? distanceKm <= b.DeliveryRadiusKm.Value
                    : false;

                return new
                {
                    Branch = b,
                    DistanceKm = Math.Round(distanceKm, 2),
                    HasCoverage = insidePolygon || insideRadius
                };
            }).ToList();

            var coveringBranch = evaluatedBranches
                .Where(x => x.HasCoverage)
                .OrderBy(x => x.DistanceKm)
                .FirstOrDefault();

            if (coveringBranch == null)
            {
                var nearest = evaluatedBranches.OrderBy(x => x.DistanceKm).FirstOrDefault();
                var nearestDistance = nearest?.DistanceKm ?? 0;
                var branchContact = !string.IsNullOrWhiteSpace(effectiveTenant.ContactPhone) ? $" al {effectiveTenant.ContactPhone}" : "";

                var outOfCoverageMsg = $"Hola{FormatContactName(contactName)}. Hemos recibido tu ubicación ({location.Latitude:F5}, {location.Longitude:F5}) para el Pedido #{order.OrderNumber}, " +
                    $"sin embargo se encuentra fuera de nuestra zona de cobertura de despacho para '{effectiveTenant.Name}'.\n\n" +
                    $"Nuestra sucursal más cercana es {nearest?.Branch.Name ?? "Matriz"} a {nearestDistance:F1} km. " +
                    $"Por favor comunícate directamente{branchContact} para coordinar la entrega o retiro en local.";

                await _whatsAppClient.SendTextMessageAsync(senderPhone, outOfCoverageMsg, phoneId, ct);
                return true;
            }

            // Actualizar la orden con las coordenadas PostGIS validadas
            order.DeliveryLocation = clientPoint;
            if (order.BranchId == 0)
            {
                order.BranchId = coveringBranch.Branch.Id;
            }

            if (!string.IsNullOrWhiteSpace(location.Address))
            {
                order.AddressStreet = location.Address;
            }

            if (!string.IsNullOrWhiteSpace(location.Name))
            {
                order.AddressReference = string.IsNullOrWhiteSpace(order.AddressReference)
                    ? location.Name
                    : $"{order.AddressReference} ({location.Name})";
            }

            order.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);

            // Registro de telemetría en Redis si es ubicación en tiempo real
            if (location.IsLiveLocation && _redis != null)
            {
                try
                {
                    var dbRedis = _redis.GetDatabase();
                    var liveData = JsonSerializer.Serialize(new
                    {
                        orderId = order.Id,
                        latitude = location.Latitude,
                        longitude = location.Longitude,
                        updatedAt = DateTime.UtcNow,
                        isLive = true
                    });
                    await dbRedis.StringSetAsync($"order:{order.Id}:live_location", liveData, TimeSpan.FromHours(2));
                }
                catch (Exception ex)
                {
                    LogRedisTelemetryWarning(_logger, ex, order.Id);
                }
            }

            // Notificación push inmediata por SignalR hacia clientes y pantalla KDS
            await _trackingNotifier.NotifyCustomerLocationUpdatedAsync(
                order.Id, location.Latitude, location.Longitude, location.IsLiveLocation, ct);

            await _kitchenNotifier.NotifyCustomerLocationUpdatedAsync(
                order.Id, order.BranchId, location.Latitude, location.Longitude, location.IsLiveLocation, ct);

            if (order.CreatedByUserId.HasValue)
            {
                await _trackingNotifier.NotifyUserOrdersChangedAsync(order.CreatedByUserId.Value, order.Id, ct);
            }

            // Confirmación personalizada por WhatsApp
            var tipoDesc = location.IsLiveLocation
                ? "en tiempo real (Live Location)"
                : "actual fija";

            var trackingUrl = $"https://{_options.PlatformDomain}/{effectiveTenant.Slug}/pedidos/{order.Id}";

            var sb = new StringBuilder();
            sb.AppendFormat(CultureInfo.InvariantCulture, "Ubicación {0} registrada exitosamente para tu Pedido #{1}.\n\n", tipoDesc, order.OrderNumber);
            sb.AppendFormat(CultureInfo.InvariantCulture, "- Estado del pedido: {0}\n", GetStatusName(order.Status));
            sb.AppendFormat(CultureInfo.InvariantCulture, "- Sucursal asignada: {0} ({1:F1} km)\n", coveringBranch.Branch.Name, coveringBranch.DistanceKm);
            sb.AppendFormat(CultureInfo.InvariantCulture, "- Coordenadas satelitales: {0:F5}, {1:F5}\n", location.Latitude, location.Longitude);

            if (!string.IsNullOrWhiteSpace(order.AddressStreet))
            {
                sb.AppendFormat(CultureInfo.InvariantCulture, "- Dirección: {0}\n", order.AddressStreet);
            }

            if (location.IsLiveLocation)
            {
                sb.AppendLine("- Telemetría: El repartidor recibirá tu posición en tiempo real durante el despacho.");
            }

            sb.AppendFormat(CultureInfo.InvariantCulture, "\nPuedes visualizar el avance de tu orden y el mapa en vivo aquí:\n{0}", trackingUrl);

            await _whatsAppClient.SendTextMessageAsync(senderPhone, sb.ToString(), phoneId, ct);
            return true;
        }

        // 5. Caso B: No se encontró orden activa previa -> Guardar en el directorio de clientes
        await SaveCustomerDefaultLocationAsync(effectiveTenant.Id, senderPhone, contactName, clientPoint, location.Address, ct);

        var noOrderReply = $"Hola{FormatContactName(contactName)}. Hemos recibido tu ubicación ({location.Latitude:F5}, {location.Longitude:F5}) " +
            $"y ha quedado guardada en nuestro sistema para tus próximos pedidos a domicilio en '{effectiveTenant.Name}'.\n\n" +
            $"Actualmente no tienes un pedido activo en curso. Para consultar nuestro menú oficial o realizar un pedido, ingresa a:\n" +
            $"https://{_options.PlatformDomain}/{effectiveTenant.Slug}/menu";

        await _whatsAppClient.SendTextMessageAsync(senderPhone, noOrderReply, phoneId, ct);
        return true;
    }

    private async Task SaveCustomerDefaultLocationAsync(
        Guid tenantId,
        string senderPhone,
        string? contactName,
        Point locationPoint,
        string? address,
        CancellationToken ct)
    {
        try
        {
            var cleanPhone = senderPhone.Replace("+", "").Trim();
            var searchDigits = cleanPhone.Length >= 8 ? cleanPhone[^8..] : cleanPhone;

            var customer = await _db.Customers
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(c => c.TenantId == tenantId && c.Phone.Contains(searchDigits), ct);

            if (customer != null)
            {
                customer.DefaultLocationPoint = locationPoint;
                if (!string.IsNullOrWhiteSpace(address))
                {
                    customer.DefaultAddressStreet = address;
                }
                customer.LastOrderAt = DateTime.UtcNow;
            }
            else
            {
                customer = new Customer
                {
                    TenantId = tenantId,
                    FullName = contactName ?? "Cliente WhatsApp",
                    Phone = senderPhone,
                    DefaultLocationPoint = locationPoint,
                    DefaultAddressStreet = address,
                    IdentificationType = "CONSUMIDOR_FINAL",
                    IdentificationNumber = "9999999999999",
                    CreatedAt = DateTime.UtcNow
                };
                _db.Customers.Add(customer);
            }

            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            LogSaveCustomerLocationError(_logger, ex, senderPhone);
        }
    }

    private static string FormatContactName(string? contactName) =>
        !string.IsNullOrWhiteSpace(contactName) ? $" {contactName.Trim()}" : "";

    private static string GetStatusName(OrderStatus status) => status switch
    {
        OrderStatus.Created => "Recibido en espera de confirmación",
        OrderStatus.PendingValidation => "Pendiente de validación de pago",
        OrderStatus.Confirmed => "Confirmado por el restaurante",
        OrderStatus.InKitchen => "En preparación en cocina",
        OrderStatus.ReadyForDelivery => "Listo y empacado para despacho",
        OrderStatus.OnTheWay => "En camino con el repartidor hacia tu dirección",
        OrderStatus.Delivered => "Entregado exitosamente",
        OrderStatus.Cancelled => "Cancelado",
        _ => status.ToString()
    };

    [GeneratedRegex(@"(?:#|pedido\s*#?|orden\s*#?|ticket\s*#?|comanda\s*#?)\s*(\d{1,8})", RegexOptions.IgnoreCase)]
    private static partial Regex OrderNumberRegex();

    [LoggerMessage(EventId = 1, Level = LogLevel.Information, Message = "Procesando ubicación de WhatsApp para {Phone} - Lat: {Lat}, Lng: {Lng}, EnTiempoReal: {IsLive}")]
    private static partial void LogLocationProcessingStarted(ILogger logger, string phone, double lat, double lng, bool isLive);

    [LoggerMessage(EventId = 2, Level = LogLevel.Warning, Message = "No se pudo almacenar telemetría en vivo en Redis para la orden {OrderId}")]
    private static partial void LogRedisTelemetryWarning(ILogger logger, Exception ex, Guid orderId);

    [LoggerMessage(EventId = 3, Level = LogLevel.Error, Message = "Error guardando ubicación predeterminada para cliente {Phone}")]
    private static partial void LogSaveCustomerLocationError(ILogger logger, Exception ex, string phone);
}
