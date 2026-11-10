using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using Delivery.Core.Domain.Entities;
using Delivery.Core.Domain.Enums;
using Delivery.Core.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Delivery.Features.Chatbot.WhatsAppWebhook;

public partial class TenantKnowledgeProvider : ITenantKnowledgeProvider
{
    private readonly AppDbContext _db;
    private readonly WhatsAppChatbotOptions _options;
    private readonly ILogger<TenantKnowledgeProvider> _logger;

    public TenantKnowledgeProvider(
        AppDbContext db,
        IOptions<WhatsAppChatbotOptions> options,
        ILogger<TenantKnowledgeProvider> logger)
    {
        _db = db;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<TenantChatContext> ResolveContextAsync(string phoneNumberId, string? userMessage = null, CancellationToken ct = default)
    {
        var tenants = await _db.Tenants
            .AsNoTracking()
            .Include(t => t.Branches.Where(b => b.IsActive))
            .Include(t => t.Categories)
            .Include(t => t.Products.Where(p => p.IsActive))
            .Where(t => t.IsActive)
            .ToListAsync(ct);

        Tenant? activeTenant = null;

        if (!string.IsNullOrWhiteSpace(userMessage))
        {
            var lowerMsg = userMessage.ToLowerInvariant();
            activeTenant = tenants.FirstOrDefault(t =>
                lowerMsg.Contains(t.Slug.ToLowerInvariant(), StringComparison.OrdinalIgnoreCase) ||
                lowerMsg.Contains(t.Name.ToLowerInvariant(), StringComparison.OrdinalIgnoreCase));
        }

        activeTenant ??= tenants.FirstOrDefault(t => t.Slug == "la-granjita")
                         ?? tenants.FirstOrDefault();

        if (activeTenant == null)
        {
            throw new InvalidOperationException("No se encontró ningún tenant activo en el sistema.");
        }

        var branches = activeTenant.Branches.ToList();
        var products = activeTenant.Products.ToList();

        var systemPrompt = BuildSystemPrompt(activeTenant, branches, products);

        return new TenantChatContext
        {
            Tenant = activeTenant,
            Branches = branches,
            Products = products,
            SystemPrompt = systemPrompt
        };
    }

    public async Task<string?> TryResolveOrderStatusAsync(Guid tenantId, string customerPhone, string userMessage, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(userMessage)) return null;

        var match = OrderNumberRegex().Match(userMessage);
        if (!match.Success) return null;

        if (!int.TryParse(match.Groups[1].Value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var orderNumber)) return null;

        try
        {
            var order = await _db.Orders
                .AsNoTracking()
                .Include(o => o.Branch)
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.TenantId == tenantId && o.OrderNumber == orderNumber, ct);

            if (order == null)
            {
                return string.Format(CultureInfo.InvariantCulture,
                    "El pedido #{0} no fue encontrado en nuestro sistema. Verifica que el número de ticket sea correcto.", orderNumber);
            }

            var statusName = order.Status switch
            {
                OrderStatus.Created => "Recibido en espera de confirmación",
                OrderStatus.PendingValidation => "Pendiente de validación de pago",
                OrderStatus.Confirmed => "Confirmado por el restaurante",
                OrderStatus.InKitchen => "En preparación en cocina",
                OrderStatus.ReadyForDelivery => "Listo y empacado para despacho",
                OrderStatus.OnTheWay => "En camino con el repartidor hacia tu dirección",
                OrderStatus.Delivered => "Entregado exitosamente",
                OrderStatus.Cancelled => "Cancelado",
                _ => order.Status.ToString()
            };

            var sb = new StringBuilder();
            sb.AppendFormat(CultureInfo.InvariantCulture, "INFORMACIÓN OFICIAL DEL PEDIDO #{0}:\n", order.OrderNumber);
            sb.AppendFormat(CultureInfo.InvariantCulture, "- Estado actual: {0}\n", statusName);
            sb.AppendFormat(CultureInfo.InvariantCulture, "- Sucursal de origen: {0}\n", order.Branch?.Name ?? "Principal");
            sb.AppendFormat(CultureInfo.InvariantCulture, "- Tipo: {0}\n", order.DeliveryType == DeliveryType.Delivery ? "Entrega a Domicilio" : "Retiro en Local");
            sb.AppendFormat(CultureInfo.InvariantCulture, "- Total: ${0:F2} USD\n", order.Total);
            sb.AppendFormat(CultureInfo.InvariantCulture, "- Fecha/Hora: {0:dd/MM/yyyy HH:mm}\n", order.CreatedAt);
            sb.AppendFormat(CultureInfo.InvariantCulture, "- Enlace de rastreo satelital: https://{0}/{1}/rastreo/{2}\n",
                _options.PlatformDomain, order.Tenant?.Slug ?? "la-granjita", order.Id);

            return sb.ToString();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error buscando pedido #{OrderNumber}", orderNumber);
            return null;
        }
    }

    private string BuildSystemPrompt(Tenant tenant, List<Branch> branches, List<Product> products)
    {
        var sb = new StringBuilder();
        sb.AppendFormat(CultureInfo.InvariantCulture, "Eres el asistente virtual oficial de WhatsApp de '{0}'.\n", tenant.Name);
        sb.AppendFormat(CultureInfo.InvariantCulture, "Eslogan: {0}\n", tenant.Tagline);
        sb.AppendLine("Tu misión es brindar atención cordial, rápida, ejecutiva y precisa a los comensales.");
        sb.AppendLine("REGLAS ESTRICTAS DE COMPORTAMIENTO:");
        sb.AppendLine("1. Responde siempre en español con tono amable, sobrio, formal y directo.");
        sb.AppendLine("2. Cero emojis en tus respuestas.");
        sb.AppendLine("3. Brinda únicamente precios y productos que existan en la lista oficial a continuación. Si el cliente pide algo que no está en la carta, infórmale cortésmente que no está disponible.");
        sb.AppendLine("4. Los precios son exactos en dólares estadounidenses (USD).");
        sb.AppendFormat(CultureInfo.InvariantCulture, "5. Si el cliente desea realizar su pedido formalmente o pagar en línea con tarjeta/transferencia/efectivo, invítalo a ingresar a la tienda web: https://{0}/{1}/menu\n",
            _options.PlatformDomain, tenant.Slug);
        sb.AppendLine("6. Mantén las respuestas concisas (máximo 2 a 3 párrafos o lista con viñetas) para que se lean cómodamente en la pantalla del celular sin saturar al usuario.\n");

        sb.AppendLine("SUCURSALES Y HORARIOS:");
        if (branches.Count == 0)
        {
            sb.AppendLine("- Sucursal Matriz (Atención diaria de 10:30 a 21:30)");
        }
        else
        {
            foreach (var b in branches)
            {
                sb.AppendFormat(CultureInfo.InvariantCulture, "- {0}: {1} | Horario: {2} a {3} | Tel: {4}\n",
                    b.Name, b.Address, b.OpeningTime, b.ClosingTime, b.Phone);
            }
        }
        sb.AppendLine();

        sb.AppendLine("MENÚ OFICIAL Y PRECIOS DISPONIBLES:");
        var grouped = products.GroupBy(p => string.IsNullOrWhiteSpace(p.Category) ? "General" : p.Category);
        foreach (var group in grouped)
        {
            sb.AppendFormat(CultureInfo.InvariantCulture, "[{0}]\n", group.Key.ToUpperInvariant());
            foreach (var prod in group)
            {
                var desc = string.IsNullOrWhiteSpace(prod.Description) ? "" : $" - {prod.Description}";
                sb.AppendFormat(CultureInfo.InvariantCulture, "* {0}: ${1:F2} USD{2}\n", prod.Name, prod.BasePrice, desc);
            }
            sb.AppendLine();
        }

        return sb.ToString();
    }

    [GeneratedRegex(@"(?:#|pedido\s*#?|orden\s*#?)\s*(\d{4,6})", RegexOptions.IgnoreCase)]
    private static partial Regex OrderNumberRegex();
}

