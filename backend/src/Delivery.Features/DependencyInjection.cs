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
