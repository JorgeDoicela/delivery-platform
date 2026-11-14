using System.Reflection;
using Delivery.Core.Contracts.Emails;
using Delivery.Core.Infrastructure.Emails;
using Delivery.Features.Common.Endpoints;
using Delivery.Features.Common.Handlers;
using Delivery.Features.Common.Security;
using Delivery.Features.Common.Services;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace Delivery.Features;

public static class DependencyInjection
{
    public static IServiceCollection AddDeliveryFeatures(this IServiceCollection services)
    {
        var assembly = typeof(DependencyInjection).Assembly;

        // 0. Servicios de Seguridad y Autenticacion
        services.AddHttpClient();
        services.AddSingleton<IPasswordHasher, BCryptPasswordHasher>();
        services.AddSingleton<ITokenProvider, JwtTokenProvider>();
        services.AddScoped<Delivery.Features.Auth.GoogleAuth.IGoogleTokenValidator, Delivery.Features.Auth.GoogleAuth.GoogleTokenValidator>();

        // 0.1 Servicios de Mensajería y Correo Electrónico SMTP
        services.AddSingleton<IEmailTemplateEngine, HtmlEmailTemplateEngine>();
        services.AddScoped<IEmailService, MailKitSmtpEmailService>();
        services.AddScoped<IBackgroundEmailQueue, HangfireBackgroundEmailQueue>();

        // 0.1.1 Almacenamiento y Optimización de Archivos/Imágenes (WebP)
        services.AddScoped<Delivery.Core.Contracts.Storage.IAvatarStorage, LocalAvatarStorage>();

        // 0.2 Servicios de Chatbot WhatsApp Cloud API e IA Conversacional
        services.AddOptions<Delivery.Features.Chatbot.WhatsAppWebhook.WhatsAppChatbotOptions>()
            .Configure(options =>
            {
                var envPhoneId = Environment.GetEnvironmentVariable("WHATSAPP_PHONE_NUMBER_ID");
                if (!string.IsNullOrWhiteSpace(envPhoneId)) options.PhoneNumberId = envPhoneId;

                var envWabaId = Environment.GetEnvironmentVariable("WHATSAPP_BUSINESS_ACCOUNT_ID");
                if (!string.IsNullOrWhiteSpace(envWabaId)) options.BusinessAccountId = envWabaId;

                var envToken = Environment.GetEnvironmentVariable("WHATSAPP_ACCESS_TOKEN");
                if (!string.IsNullOrWhiteSpace(envToken)) options.AccessToken = envToken;

                var envVerifyToken = Environment.GetEnvironmentVariable("WHATSAPP_VERIFY_TOKEN");
                if (!string.IsNullOrWhiteSpace(envVerifyToken)) options.VerifyToken = envVerifyToken;

                var envAppSecret = Environment.GetEnvironmentVariable("WHATSAPP_APP_SECRET");
                if (!string.IsNullOrWhiteSpace(envAppSecret)) options.AppSecret = envAppSecret;

                var envDeepSeekKey = Environment.GetEnvironmentVariable("DEEPSEEK_API_KEY");
                if (!string.IsNullOrWhiteSpace(envDeepSeekKey)) options.DeepSeekApiKey = envDeepSeekKey;

                var envGeminiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY");
                if (!string.IsNullOrWhiteSpace(envGeminiKey)) options.GeminiApiKey = envGeminiKey;

                var envDomain = Environment.GetEnvironmentVariable("PLATFORM_DOMAIN");
                if (!string.IsNullOrWhiteSpace(envDomain)) options.PlatformDomain = envDomain;
            });

        services.AddSingleton<Delivery.Features.Chatbot.WhatsAppWebhook.IConversationStore, Delivery.Features.Chatbot.WhatsAppWebhook.RedisConversationStore>();
        services.AddScoped<Delivery.Features.Common.Privacy.ICustomerConsentTracker, Delivery.Features.Chatbot.WhatsAppWebhook.CustomerConsentTracker>();
        services.AddScoped<Delivery.Features.Chatbot.WhatsAppWebhook.ITenantKnowledgeProvider, Delivery.Features.Chatbot.WhatsAppWebhook.TenantKnowledgeProvider>();
        services.AddScoped<Delivery.Features.Chatbot.WhatsAppWebhook.DeepSeekAiEngine>();
        services.AddScoped<Delivery.Features.Chatbot.WhatsAppWebhook.GeminiAiEngine>();
        services.AddScoped<Delivery.Features.Chatbot.WhatsAppWebhook.IChatbotAiEngine, Delivery.Features.Chatbot.WhatsAppWebhook.ResilientChatbotAiEngine>();
        services.AddScoped<Delivery.Features.Chatbot.WhatsAppWebhook.IWhatsAppClient, Delivery.Features.Chatbot.WhatsAppWebhook.WhatsAppClient>();
        services.AddScoped<Delivery.Features.Chatbot.WhatsAppWebhook.IWhatsAppOrderLocationProcessor, Delivery.Features.Chatbot.WhatsAppWebhook.WhatsAppOrderLocationProcessor>();
        services.AddScoped<Delivery.Features.Chatbot.WhatsAppWebhook.IWhatsAppWebhookProcessor, Delivery.Features.Chatbot.WhatsAppWebhook.WhatsAppWebhookProcessor>();

        // 1. Registro automático de Validadores FluentValidation
        services.AddValidatorsFromAssembly(assembly);

        // 2. Registro dinámico y automático de Handlers de Casos de Uso (Vertical Slices)
        var handlerTypes = assembly.GetTypes()
            .Where(t => !t.IsAbstract && !t.IsInterface && t.Name.EndsWith("Handler", StringComparison.Ordinal));

        foreach (var handlerType in handlerTypes)
        {
            services.AddScoped(handlerType);

            // Registro de contratos IHandler<TRequest, TResponse> para despacho desacoplado
            var handlerInterfaces = handlerType.GetInterfaces()
                .Where(i => i.IsGenericType && i.GetGenericTypeDefinition() == typeof(IHandler<,>));

            foreach (var handlerInterface in handlerInterfaces)
            {
                services.AddScoped(handlerInterface, handlerType);
            }
        }

        // 3. Auto-registro de Endpoints de cada Vertical Slice
        services.AddEndpoints(assembly);

        return services;
    }
}
