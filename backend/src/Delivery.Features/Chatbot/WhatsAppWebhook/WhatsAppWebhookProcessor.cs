using System.Text.RegularExpressions;
using Delivery.Features.Common.Privacy;
using Delivery.Features.Common.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Delivery.Features.Chatbot.WhatsAppWebhook;

public partial class WhatsAppWebhookProcessor : IWhatsAppWebhookProcessor
{
    private readonly ITenantKnowledgeProvider _knowledgeProvider;
    private readonly IConversationStore _conversationStore;
    private readonly ICustomerConsentTracker _consentTracker;
    private readonly IChatbotAiEngine _aiEngine;
    private readonly IWhatsAppClient _whatsAppClient;
    private readonly IWhatsAppOrderLocationProcessor? _locationProcessor;
    private readonly IWhatsAppAuthChallengeStore? _authChallengeStore;
    private readonly WhatsAppChatbotOptions _options;
    private readonly ILogger<WhatsAppWebhookProcessor> _logger;

    public WhatsAppWebhookProcessor(
        ITenantKnowledgeProvider knowledgeProvider,
        IConversationStore conversationStore,
        ICustomerConsentTracker consentTracker,
        IChatbotAiEngine aiEngine,
        IWhatsAppClient whatsAppClient,
        IOptions<WhatsAppChatbotOptions> options,
        ILogger<WhatsAppWebhookProcessor> logger,
        IWhatsAppOrderLocationProcessor? locationProcessor = null,
        IWhatsAppAuthChallengeStore? authChallengeStore = null)
    {
        _knowledgeProvider = knowledgeProvider;
        _conversationStore = conversationStore;
        _consentTracker = consentTracker;
        _aiEngine = aiEngine;
        _whatsAppClient = whatsAppClient;
        _options = options.Value;
        _logger = logger;
        _locationProcessor = locationProcessor;
        _authChallengeStore = authChallengeStore;
    }

    public async Task ProcessPayloadAsync(WhatsAppWebhookPayload payload, CancellationToken ct = default)
    {
        if (payload?.Entry == null || payload.Entry.Count == 0) return;

        foreach (var entry in payload.Entry)
        {
            if (entry.Changes == null) continue;

            foreach (var change in entry.Changes)
            {
                if (change.Value?.Messages == null || change.Value.Messages.Count == 0)
                {
                    continue;
                }

                var phoneId = change.Value.Metadata?.PhoneNumberId ?? string.Empty;
                var contact = change.Value.Contacts?.FirstOrDefault();
                var contactName = contact?.Profile?.Name;

                foreach (var incoming in change.Value.Messages)
                {
                    await HandleSingleMessageAsync(incoming, phoneId, contactName, ct);
                }
            }
        }
    }

    private async Task HandleSingleMessageAsync(
        WhatsAppIncomingMessage incoming,
        string phoneId,
        string? contactName,
        CancellationToken ct)
    {
        var messageId = incoming.Id;
        var senderPhone = incoming.From;

        if (string.IsNullOrWhiteSpace(senderPhone) || string.IsNullOrWhiteSpace(messageId))
        {
            return;
        }

        if (await _conversationStore.IsMessageProcessedAsync(messageId, ct))
        {
            LogDuplicateMessageIgnored(_logger, messageId);
            return;
        }

        await _conversationStore.MarkMessageProcessedAsync(messageId, ct);
        await _whatsAppClient.MarkMessageAsReadAsync(messageId, phoneId, ct);

        // 1. Detección y procesamiento de ubicación actual o en tiempo real (nativa o por enlace en texto)
        if (_locationProcessor != null)
        {
            var extractedLocation = WhatsAppLocationParser.ExtractLocation(incoming);
            if (extractedLocation != null)
            {
                var handled = await _locationProcessor.HandleLocationAsync(incoming, extractedLocation, phoneId, contactName, ct);
                if (handled)
                {
                    return;
                }
            }
        }

        if (incoming.Type != "text" || incoming.Text == null || string.IsNullOrWhiteSpace(incoming.Text.Body))
        {
            var politeMsg = "Hola" + (!string.IsNullOrWhiteSpace(contactName) ? $" {contactName}" : "") +
                            ". En este momento solo puedo procesar mensajes de texto o ubicaciones satelitales para entrega. ¿En qué puedo ayudarte hoy?";
            await _whatsAppClient.SendTextMessageAsync(senderPhone, politeMsg, phoneId, ct);
            return;
        }

        var userText = incoming.Text.Body.Trim();
        LogMessageReceived(_logger, senderPhone, contactName ?? "Anónimo", userText);

        // 0. Intercepción de verificación de inicio de sesión Inbound ($0 Meta, sin bloqueo de ventana 24h)
        if (_authChallengeStore != null && await TryHandleInboundLoginCodeAsync(userText, senderPhone, contactName, phoneId, ct))
        {
            return;
        }

        try
        {
            var sessionTenantId = await _conversationStore.GetActiveTenantSessionAsync(senderPhone, ct);
            var tenantContext = await _knowledgeProvider.ResolveContextAsync(phoneId, userText, senderPhone, sessionTenantId, ct);
            var tenant = tenantContext.Tenant;
            var tenantId = tenant.Id;
            var settings = tenant.Settings;

            // 1. Verificación de Feature Flag: ¿Está habilitado el bot de WhatsApp para este establecimiento?
            if (settings != null && !settings.EnableWhatsAppBot)
            {
                var contactPhone = !string.IsNullOrWhiteSpace(tenant.ContactPhone) ? $" al {tenant.ContactPhone}" : "";
                var disabledMsg = $"Estimado/a cliente, la atención automatizada por WhatsApp para '{tenant.Name}' no se encuentra disponible temporalmente. Puedes realizar tus pedidos en nuestra tienda web oficial: https://{_options.PlatformDomain}/{tenant.Slug}/menu o comunicarte directamente{contactPhone}.";
                await _whatsAppClient.SendTextMessageAsync(senderPhone, disabledMsg, phoneId, ct);
                return;
            }

            // 2. Verificación de Consentimiento Legal LOPDP (Ecuador / Estándar Internacional)
            var requireConsent = settings == null || settings.RequireDataProtectionConsent;
            if (requireConsent)
            {
                // A. ¿El usuario solicita revocatoria expresa de sus datos?
                if (ConsentRevocationRegex().IsMatch(userText))
                {
                    await _consentTracker.RevokeConsentAsync(tenantId, senderPhone, ct);

                    var revokeMsg = $"Tu consentimiento para el tratamiento de datos personales en '{tenant.Name}' ha sido revocado conforme a la LOPDP. Tus datos no serán procesados. Si en el futuro deseas consultar el menú o realizar pedidos por WhatsApp, deberás autorizarnos nuevamente respondiendo 'ACEPTO'.";
                    await _whatsAppClient.SendTextMessageAsync(senderPhone, revokeMsg, phoneId, ct);
                    return;
                }

                var hasConsent = await _consentTracker.HasConsentAsync(tenantId, senderPhone, ct);

                if (!hasConsent)
                {
                    // B. ¿El usuario está respondiendo 'ACEPTO' al aviso legal previo?
                    if (ConsentAcceptanceRegex().IsMatch(userText))
                    {
                        await _consentTracker.RegisterConsentAsync(tenantId, senderPhone, messageId, ct);

                        // Refrescar sesión para turnos inmediatos
                        await _conversationStore.SetActiveTenantSessionAsync(senderPhone, tenantId, ct);

                        var acceptedMsg = $"Muchas gracias. Tu consentimiento para el tratamiento de datos personales en '{tenant.Name}' ha quedado registrado conforme a la Ley Orgánica de Protección de Datos Personales (LOPDP).\n\n¿En qué podemos ayudarte hoy? Puedes consultar nuestro menú oficial, combos, horarios de atención de nuestras sucursales o el estado de tus pedidos.";
                        await _whatsAppClient.SendTextMessageAsync(senderPhone, acceptedMsg, phoneId, ct);
                        return;
                    }

                    // C. El usuario aún no ha otorgado consentimiento: Enviar aviso legal y bloquear llamada a IA
                    var policyUrl = !string.IsNullOrWhiteSpace(settings?.CustomPrivacyPolicyUrl)
                        ? settings.CustomPrivacyPolicyUrl
                        : $"https://{_options.PlatformDomain}/{tenant.Slug}/privacidad";

                    var legalNoticeMsg = $"Bienvenido a '{tenant.Name}'. En cumplimiento de la Ley Orgánica de Protección de Datos Personales (LOPDP), requerimos tu autorización para tratar tu número telefónico y atender tus pedidos y consultas de forma segura.\n\nPuedes revisar nuestra política de privacidad oficial en:\n{policyUrl}\n\nPara continuar y acceder a nuestra atención, por favor responde con la palabra *ACEPTO*.";
                    await _whatsAppClient.SendTextMessageAsync(senderPhone, legalNoticeMsg, phoneId, ct);
                    return;
                }
            }

            // Mantener / refrescar la sesión activa del comensal para turnos posteriores
            await _conversationStore.SetActiveTenantSessionAsync(senderPhone, tenantId, ct);

            // 3. Solicitud explícita de enlace directo a su cuenta o inicio de sesión desde el chat
            if (_authChallengeStore != null && MagicLinkRequestRegex().IsMatch(userText))
            {
                var accountMagicToken = await _authChallengeStore.CreateMagicLinkAsync(
                    senderPhone,
                    contactName,
                    tenant.Slug,
                    "/cuenta",
                    TimeSpan.FromMinutes(15),
                    ct);

                var directAccountUrl = $"https://{_options.PlatformDomain}/{tenant.Slug}/auth/wa?t={accountMagicToken}&next=%2Fcuenta";
                var magicReply = $"Aquí tienes tu enlace seguro de acceso directo a '{tenant.Name}' (válido por 15 minutos, un solo uso):\n{directAccountUrl}\n\nAl abrirlo ingresarás automáticamente a tu cuenta sin contraseñas.";
                await _whatsAppClient.SendTextMessageAsync(senderPhone, magicReply, phoneId, ct);
                return;
            }

            var orderInfo = await _knowledgeProvider.TryResolveOrderStatusAsync(tenantId, senderPhone, userText, ct);
            var history = await _conversationStore.GetHistoryAsync(tenantId, senderPhone, ct);

            // 4. Enriquecer el System Prompt con un Magic Link autenticado al menú para que el cliente entre en 1 clic
            var effectiveSystemPrompt = tenantContext.SystemPrompt;
            if (_authChallengeStore != null)
            {
                var genericMenuUrl = $"https://{_options.PlatformDomain}/{tenant.Slug}/menu";
                if (effectiveSystemPrompt.Contains(genericMenuUrl, StringComparison.OrdinalIgnoreCase))
                {
                    var menuMagicToken = await _authChallengeStore.CreateMagicLinkAsync(
                        senderPhone,
                        contactName,
                        tenant.Slug,
                        "/menu",
                        TimeSpan.FromMinutes(30),
                        ct);
                    var authenticatedMenuUrl = $"https://{_options.PlatformDomain}/{tenant.Slug}/auth/wa?t={menuMagicToken}&next=%2Fmenu";
                    effectiveSystemPrompt = effectiveSystemPrompt.Replace(genericMenuUrl, authenticatedMenuUrl, StringComparison.OrdinalIgnoreCase);
                }
            }

            var aiReply = await _aiEngine.GenerateReplyAsync(
                effectiveSystemPrompt,
                history,
                userText,
                orderInfo,
                ct);

            var sent = await _whatsAppClient.SendTextMessageAsync(senderPhone, aiReply, phoneId, ct);

            if (sent)
            {
                await _conversationStore.AppendMessageAsync(tenantId, senderPhone, new ChatMessageDto
                {
                    Role = "user",
                    Content = userText,
                    Timestamp = DateTime.UtcNow
                }, ct);

                await _conversationStore.AppendMessageAsync(tenantId, senderPhone, new ChatMessageDto
                {
                    Role = "assistant",
                    Content = aiReply,
                    Timestamp = DateTime.UtcNow
                }, ct);
            }
        }
        catch (Exception ex)
        {
            LogProcessMessageError(_logger, ex, senderPhone);

            var fallbackMsg = "Estimado/a cliente, ocurrió un inconveniente temporal procesando tu mensaje. Si deseas ordenar, visita nuestra tienda en línea o intenta nuevamente en unos instantes.";
            await _whatsAppClient.SendTextMessageAsync(senderPhone, fallbackMsg, phoneId, ct);
        }
    }

    [LoggerMessage(EventId = 1, Level = LogLevel.Information, Message = "Mensaje duplicado ignorado: {MessageId}")]
    private static partial void LogDuplicateMessageIgnored(ILogger logger, string messageId);

    [LoggerMessage(EventId = 2, Level = LogLevel.Information, Message = "Mensaje recibido de {Phone} ({Name}): {Text}")]
    private static partial void LogMessageReceived(ILogger logger, string phone, string name, string text);

    [LoggerMessage(EventId = 3, Level = LogLevel.Error, Message = "Error procesando mensaje de WhatsApp de {Phone}")]
    private static partial void LogProcessMessageError(ILogger logger, Exception ex, string phone);

    private async Task<bool> TryHandleInboundLoginCodeAsync(
        string userText,
        string senderPhone,
        string? contactName,
        string phoneId,
        CancellationToken ct)
    {
        var match = InboundLoginCodeRegex().Match(userText);
        if (!match.Success)
        {
            return false;
        }

        var code = match.Groups[1].Value.Trim().ToUpperInvariant();
        var verified = await _authChallengeStore!.VerifyChallengeByCodeAsync(code, senderPhone, contactName, ct);

        if (verified is null)
        {
            const string expiredMsg = "El código de acceso expiró o ya fue utilizado. Por favor genera un nuevo acceso desde la pantalla de inicio de sesión.";
            await _whatsAppClient.SendTextMessageAsync(senderPhone, expiredMsg, phoneId, ct);
            return true;
        }

        var magicToken = await _authChallengeStore.CreateMagicLinkAsync(
            senderPhone,
            contactName,
            verified.TenantSlug,
            null,
            TimeSpan.FromMinutes(15),
            ct);

        var slugPrefix = string.IsNullOrWhiteSpace(verified.TenantSlug) ? "" : $"/{verified.TenantSlug}";
        var magicUrl = $"https://{_options.PlatformDomain}{slugPrefix}/auth/wa?t={magicToken}";
        var greeting = !string.IsNullOrWhiteSpace(contactName) ? $" {contactName}" : "";

        var confirmMsg = $"Listo{greeting}, tu identidad fue verificada.\n\nVuelve a la pestaña del navegador (iniciará sesión automáticamente) o ingresa directo aquí:\n{magicUrl}";
        await _whatsAppClient.SendTextMessageAsync(senderPhone, confirmMsg, phoneId, ct);
        return true;
    }

    [GeneratedRegex(@"^(?:acepto(?:\s+t[eé]rminos)?|aceptar|s[ií]|1|de\s+acuerdo|autorizo)$", RegexOptions.IgnoreCase)]
    private static partial Regex ConsentAcceptanceRegex();

    [GeneratedRegex(@"^(?:revocar(?:\s+consentimiento)?|eliminar\s+mis\s+datos|borrar\s+mis\s+datos|cancelar\s+consentimiento|no\s+autorizo)$", RegexOptions.IgnoreCase)]
    private static partial Regex ConsentRevocationRegex();

    [GeneratedRegex(@"(?:c[oó]digo|iniciar\s+sesi[oó]n|acceso)\s*[:#-]?\s*([A-Z0-9]{6})\b", RegexOptions.IgnoreCase)]
    private static partial Regex InboundLoginCodeRegex();

    [GeneratedRegex(@"(?:^|\b)(?:mi\s+cuenta|iniciar\s+sesi[oó]n|entrar\s+a\s+la\s+web|ingresar\s+a\s+mi\s+cuenta|link\s+de\s+acceso|enlace\s+de\s+acceso)(?:\b|$)", RegexOptions.IgnoreCase)]
    private static partial Regex MagicLinkRequestRegex();
}

