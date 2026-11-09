using System.Globalization;

namespace Delivery.Core.Contracts.Emails.Models;

/// <summary>
/// Contexto de personalización visual e identidad de marca para plantillas de correo multi-tenant.
/// </summary>
public sealed record BrandEmailContext
{
    public string BrandName { get; init; } = "Mesafy Gastronomía";
    public string BrandTagline { get; init; } = "Plataforma de Pedidos y Delivery en Tiempo Real";
    public string PrimaryColor { get; init; } = "#E4002B";
    public string AccentColor { get; init; } = "#F59E0B";
    public string? LogoUrl { get; init; }
    public string? StoreUrl { get; init; }
    public string? SupportPhone { get; init; }
    public string? SupportEmail { get; init; }
    public string Year { get; init; } = DateTime.UtcNow.Year.ToString(CultureInfo.InvariantCulture);

    public static BrandEmailContext DefaultPlatform => new()
    {
        BrandName = "Mesafy",
        BrandTagline = "Plataforma Integral de Pedidos y Delivery Gastronómico",
        PrimaryColor = "#0F172A",
        StoreUrl = "https://mesafy.doicela.dev",
        SupportEmail = "soporte@mesafy.doicela.dev"
    };
}
