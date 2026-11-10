using System.Globalization;
using System.Net;
using System.Text;
using Delivery.Core.Contracts.Emails;
using Delivery.Core.Contracts.Emails.Models;

namespace Delivery.Core.Infrastructure.Emails;

/// <summary>
/// Motor de plantillas HTML y texto plano de alto rendimiento con diseño profesional y responsive.
/// Compatible con clientes de correo modernos y clásicos (Outlook, Gmail, iOS Mail, Thunderbird).
/// </summary>
public sealed class HtmlEmailTemplateEngine : IEmailTemplateEngine
{
    private static string FormatCurrency(decimal amount) => amount.ToString("F2", CultureInfo.InvariantCulture);

    public (string HtmlBody, string PlainTextBody) Render<TModel>(EmailTemplateType templateType, TModel model)
    {
        return templateType switch
        {
            EmailTemplateType.OrderConfirmation when model is OrderConfirmationEmailModel m =>
                (RenderOrderConfirmationHtml(m), RenderOrderConfirmationText(m)),

            EmailTemplateType.OrderStatusChanged when model is OrderStatusChangedEmailModel m =>
                (RenderOrderStatusChangedHtml(m), RenderOrderStatusChangedText(m)),

            EmailTemplateType.WelcomeUser when model is WelcomeEmailModel m =>
                (RenderWelcomeHtml(m), RenderWelcomeText(m)),

            EmailTemplateType.SecurityPin when model is SecurityPinEmailModel m =>
                (RenderSecurityPinHtml(m), RenderSecurityPinText(m)),

            EmailTemplateType.PasswordReset when model is PasswordResetEmailModel m =>
                (RenderPasswordResetHtml(m), RenderPasswordResetText(m)),

            EmailTemplateType.EmailVerification when model is EmailVerificationEmailModel m =>
                (RenderEmailVerificationHtml(m), RenderEmailVerificationText(m)),

            EmailTemplateType.TestEmail when model is TestEmailModel m =>
                (RenderTestEmailHtml(m), RenderTestEmailText(m)),

            _ => throw new ArgumentException($"El modelo proporcionado no corresponde con el tipo de plantilla '{templateType}'.", nameof(model))
        };
    }

    #region Layout Base y Estilos CSS Inline

    private static string BuildBaseHtml(BrandEmailContext brand, string title, string contentHtml)
    {
        var primaryColor = string.IsNullOrWhiteSpace(brand.PrimaryColor) ? "#E4002B" : brand.PrimaryColor;
        var logoHtml = !string.IsNullOrWhiteSpace(brand.LogoUrl)
            ? $"<img src=\"{WebUtility.HtmlEncode(brand.LogoUrl)}\" alt=\"{WebUtility.HtmlEncode(brand.BrandName)}\" width=\"48\" height=\"48\" style=\"width:48px;height:48px;object-fit:contain;margin-bottom:8px;display:inline-block;border-radius:12px;\" />"
            : string.Empty;

        return $@"<!DOCTYPE html>
<html lang=""es"">
<head>
  <meta charset=""UTF-8"">
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
  <meta http-equiv=""X-UA-Compatible"" content=""IE=edge"">
  <title>{WebUtility.HtmlEncode(title)}</title>
  <style>
    body, table, td, p, a, li, blockquote {{ -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }}
    body {{ margin: 0; padding: 0; width: 100% !important; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B; }}
    @media screen and (max-width: 600px) {{
      .email-container {{ width: 100% !important; padding: 12px !important; }}
      .column-stack {{ display: block !important; width: 100% !important; }}
    }}
  </style>
</head>
<body style=""margin:0;padding:24px 12px;background-color:#F8FAFC;"">
  <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""max-width:600px;margin:0 auto;background-color:#FFFFFF;border-radius:24px;border:1px solid #E2E8F0;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);overflow:hidden;"" class=""email-container"">
    <!-- Header de Marca -->
    <tr>
      <td style=""background-color:{primaryColor};padding:32px 24px;text-align:center;color:#FFFFFF;"">
        {logoHtml}
        <h1 style=""margin:0;font-size:24px;font-weight:900;text-transform:uppercase;letter-spacing:0.5px;color:#FFFFFF;"">
          {WebUtility.HtmlEncode(brand.BrandName)}
        </h1>
        <p style=""margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.85);font-weight:600;letter-spacing:0.5px;text-transform:uppercase;"">
          {WebUtility.HtmlEncode(brand.BrandTagline)}
        </p>
      </td>
    </tr>

    <!-- Contenido Dinámico -->
    <tr>
      <td style=""padding:32px 28px;background-color:#FFFFFF;"">
        {contentHtml}
      </td>
    </tr>

    <!-- Footer Corporativo -->
    <tr>
      <td style=""background-color:#F1F5F9;padding:24px;text-align:center;border-top:1px solid #E2E8F0;font-size:11px;color:#64748B;line-height:1.6;"">
        <p style=""margin:0 0 6px;font-weight:700;color:#334155;"">
          {WebUtility.HtmlEncode(brand.BrandName)} &bull; Pedido Directo & Delivery
        </p>
        <p style=""margin:0 0 6px;"">
          {(string.IsNullOrEmpty(brand.SupportEmail) ? "Soporte oficial de la plataforma gastronómica." : $"Contacto directo: <a href=\"mailto:{WebUtility.HtmlEncode(brand.SupportEmail)}\" style=\"color:{primaryColor};text-decoration:none;font-weight:bold;\">{WebUtility.HtmlEncode(brand.SupportEmail)}</a>")}
        </p>
        <p style=""margin:0;color:#94A3B8;"">
          &copy; {brand.Year} {WebUtility.HtmlEncode(brand.BrandName)}. Este es un mensaje transaccional automatizado.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>";
    }

    #endregion

    #region Plantilla 1: Order Confirmation

    private static string RenderOrderConfirmationHtml(OrderConfirmationEmailModel m)
    {
        var primaryColor = string.IsNullOrWhiteSpace(m.Brand.PrimaryColor) ? "#E4002B" : m.Brand.PrimaryColor;

        var itemsRows = new StringBuilder();
        foreach (var item in m.Items)
        {
            var modifiersHtml = !string.IsNullOrEmpty(item.ModifiersSummary)
                ? $"<div style=\"font-size:11px;color:#64748B;margin-top:2px;\">{WebUtility.HtmlEncode(item.ModifiersSummary)}</div>"
                : string.Empty;

            itemsRows.Append($@"
            <tr style=""border-bottom:1px solid #F1F5F9;"">
              <td style=""padding:12px 0;vertical-align:top;"">
                <div style=""font-weight:700;color:#0F172A;font-size:13px;"">{item.Quantity}x {WebUtility.HtmlEncode(item.ProductName)}</div>
                {modifiersHtml}
              </td>
              <td style=""padding:12px 0;text-align:right;vertical-align:top;font-weight:800;font-family:monospace;font-size:13px;color:#0F172A;"">
                ${FormatCurrency(item.TotalPrice)}
              </td>
            </tr>");
        }

        var estimatedHtml = !string.IsNullOrEmpty(m.EstimatedDeliveryTime)
            ? $"<div style=\"background-color:#FEF3C7;border:1px solid #FDE68A;border-radius:12px;padding:12px 16px;margin:16px 0;font-size:12px;color:#92400E;font-weight:700;\">⏱️ Tiempo estimado de entrega: {WebUtility.HtmlEncode(m.EstimatedDeliveryTime)}</div>"
            : string.Empty;

        var content = $@"
        <div style=""text-align:center;margin-bottom:24px;"">
          <div style=""display:inline-block;background-color:#DCFCE7;color:#166534;font-size:12px;font-weight:800;padding:6px 14px;border-radius:9999px;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;"">
            &bull; Pedido Confirmado
          </div>
          <h2 style=""margin:0;font-size:22px;font-weight:900;color:#0F172A;"">¡Gracias por tu compra, {WebUtility.HtmlEncode(m.CustomerName)}!</h2>
          <p style=""margin:6px 0 0;font-size:13px;color:#64748B;"">Hemos recibido tu orden correctamente y la cocina ya fue notificada.</p>
        </div>

        <div style=""background-color:#F8FAFC;border:1px solid #E2E8F0;border-radius:16px;padding:16px 20px;margin-bottom:20px;"">
          <table width=""100%"" border=""0"" cellpadding=""0"" cellspacing=""0"">
            <tr>
              <td>
                <span style=""font-size:10px;font-weight:800;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;"">Comanda / Ticket</span>
                <div style=""font-size:20px;font-weight:900;color:{primaryColor};font-family:monospace;"">#{m.OrderNumber}</div>
              </td>
              <td style=""text-align:right;"">
                <span style=""font-size:10px;font-weight:800;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;"">Sucursal Asignada</span>
                <div style=""font-size:13px;font-weight:700;color:#0F172A;"">{WebUtility.HtmlEncode(m.BranchName)}</div>
              </td>
            </tr>
          </table>
        </div>

        {estimatedHtml}

        <h3 style=""font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:#475569;margin:24px 0 8px;"">Detalle del Pedido</h3>
        <table width=""100%"" border=""0"" cellpadding=""0"" cellspacing=""0"" style=""margin-bottom:16px;"">
          {itemsRows}
          <tr>
            <td style=""padding:8px 0;font-size:12px;color:#64748B;"">Subtotal</td>
            <td style=""padding:8px 0;text-align:right;font-size:12px;font-family:monospace;color:#475569;"">${FormatCurrency(m.Subtotal)}</td>
          </tr>
          <tr>
            <td style=""padding:4px 0;font-size:12px;color:#64748B;"">Tarifa de Entrega / Despacho</td>
            <td style=""padding:4px 0;text-align:right;font-size:12px;font-family:monospace;color:#475569;"">${FormatCurrency(m.DeliveryFee)}</td>
          </tr>
          {(m.DiscountAmount > 0 ? $@"
          <tr>
            <td style=""padding:4px 0;font-size:12px;color:#16A34A;"">Descuento Promocional</td>
            <td style=""padding:4px 0;text-align:right;font-size:12px;font-family:monospace;color:#16A34A;"">-${FormatCurrency(m.DiscountAmount)}</td>
          </tr>" : string.Empty)}
          <tr style=""border-top:2px solid #0F172A;"">
            <td style=""padding:12px 0;font-size:16px;font-weight:900;color:#0F172A;"">Total Pagado / A Cobrar</td>
            <td style=""padding:12px 0;text-align:right;font-size:18px;font-weight:900;font-family:monospace;color:{primaryColor};"">${FormatCurrency(m.Total)}</td>
          </tr>
        </table>

        <div style=""background-color:#F8FAFC;border-radius:12px;padding:12px 16px;margin-bottom:24px;font-size:12px;color:#475569;line-height:1.5;"">
          <div><strong>Dirección de Entrega:</strong> {WebUtility.HtmlEncode(m.AddressStreet)}</div>
          {(!string.IsNullOrEmpty(m.AddressReference) ? $"<div style=\"color:#64748B;font-size:11px;\">Ref: {WebUtility.HtmlEncode(m.AddressReference)}</div>" : string.Empty)}
          <div style=""margin-top:4px;""><strong>Método de Pago:</strong> {WebUtility.HtmlEncode(m.PaymentMethod)}</div>
        </div>

        <div style=""text-align:center;margin-top:28px;"">
          <a href=""{WebUtility.HtmlEncode(m.TrackingUrl)}"" style=""display:inline-block;background-color:{primaryColor};color:#FFFFFF;text-decoration:none;padding:14px 28px;border-radius:9999px;font-weight:900;font-size:13px;text-transform:uppercase;letter-spacing:1px;box-shadow:0 4px 10px rgba(0,0,0,0.15);"">
            Rastrear Pedido en Tiempo Real &rarr;
          </a>
        </div>";

        return BuildBaseHtml(m.Brand, $"Confirmación de Pedido #{m.OrderNumber}", content);
    }

    private static string RenderOrderConfirmationText(OrderConfirmationEmailModel m)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"¡Hola {m.CustomerName}!");
        sb.AppendLine($"Tu pedido #{m.OrderNumber} en {m.Brand.BrandName} ha sido confirmado con éxito.");
        sb.AppendLine($"Sucursal: {m.BranchName}");
        sb.AppendLine($"Dirección: {m.AddressStreet} {(string.IsNullOrEmpty(m.AddressReference) ? "" : $"({m.AddressReference})")}");
        sb.AppendLine();
        sb.AppendLine("DETALLE DEL PEDIDO:");
        foreach (var item in m.Items)
        {
            sb.AppendLine($"- {item.Quantity}x {item.ProductName}: ${FormatCurrency(item.TotalPrice)}");
        }
        sb.AppendLine($"Subtotal: ${FormatCurrency(m.Subtotal)}");
        sb.AppendLine($"Envío: ${FormatCurrency(m.DeliveryFee)}");
        sb.AppendLine($"TOTAL: ${FormatCurrency(m.Total)}");
        sb.AppendLine($"Método de pago: {m.PaymentMethod}");
        sb.AppendLine();
        sb.AppendLine($"Rastreo en vivo: {m.TrackingUrl}");
        return sb.ToString();
    }

    #endregion

    #region Plantilla 2: Order Status Changed

    private static string RenderOrderStatusChangedHtml(OrderStatusChangedEmailModel m)
    {
        var primaryColor = string.IsNullOrWhiteSpace(m.Brand.PrimaryColor) ? "#E4002B" : m.Brand.PrimaryColor;

        var content = $@"
        <div style=""text-align:center;margin-bottom:24px;"">
          <div style=""display:inline-block;background-color:#E0F2FE;color:#0369A1;font-size:12px;font-weight:800;padding:6px 14px;border-radius:9999px;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;"">
            Actualización de Comanda #{m.OrderNumber}
          </div>
          <h2 style=""margin:0;font-size:24px;font-weight:900;color:#0F172A;"">{WebUtility.HtmlEncode(m.StatusTitle)}</h2>
          <p style=""margin:8px 0 0;font-size:14px;color:#475569;line-height:1.5;"">{WebUtility.HtmlEncode(m.StatusDescription)}</p>
        </div>

        <div style=""background-color:#F8FAFC;border:1px solid #E2E8F0;border-radius:16px;padding:20px;text-align:center;margin-bottom:28px;"">
          <div style=""font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;"">Estado Actual</div>
          <div style=""font-size:18px;font-weight:900;color:{primaryColor};margin:4px 0;"">{WebUtility.HtmlEncode(m.CurrentStatus)}</div>
          <div style=""font-size:12px;color:#94A3B8;font-family:monospace;"">Monto del pedido: ${FormatCurrency(m.Total)}</div>
        </div>

        <div style=""text-align:center;"">
          <a href=""{WebUtility.HtmlEncode(m.TrackingUrl)}"" style=""display:inline-block;background-color:{primaryColor};color:#FFFFFF;text-decoration:none;padding:14px 28px;border-radius:9999px;font-weight:900;font-size:13px;text-transform:uppercase;letter-spacing:1px;box-shadow:0 4px 10px rgba(0,0,0,0.15);"">
            Ver Mapa y Estado en Vivo &rarr;
          </a>
        </div>";

        return BuildBaseHtml(m.Brand, $"Actualización de Pedido #{m.OrderNumber} - {m.CurrentStatus}", content);
    }

    private static string RenderOrderStatusChangedText(OrderStatusChangedEmailModel m)
    {
        return $"Hola {m.CustomerName},\n\nTu pedido #{m.OrderNumber} ha cambiado de estado: {m.CurrentStatus}.\n{m.StatusDescription}\n\nPuedes rastrear tu comanda aquí: {m.TrackingUrl}";
    }

    #endregion

    #region Plantilla 3: Welcome User

    private static string RenderWelcomeHtml(WelcomeEmailModel m)
    {
        var primaryColor = string.IsNullOrWhiteSpace(m.Brand.PrimaryColor) ? "#E4002B" : m.Brand.PrimaryColor;

        var content = $@"
        <div style=""text-align:center;margin-bottom:24px;"">
          <h2 style=""margin:0;font-size:22px;font-weight:900;color:#0F172A;"">¡Bienvenido/a a {WebUtility.HtmlEncode(m.Brand.BrandName)}!</h2>
          <p style=""margin:8px 0 0;font-size:14px;color:#475569;"">Hola <strong>{WebUtility.HtmlEncode(m.UserName)}</strong>, tu cuenta ha sido creada exitosamente con el correo <code>{WebUtility.HtmlEncode(m.UserEmail)}</code>.</p>
        </div>

        <div style=""background-color:#F8FAFC;border-radius:16px;padding:20px;margin-bottom:24px;font-size:13px;color:#334155;line-height:1.6;"">
          <p style=""margin:0 0 10px;"">Ahora puedes disfrutar de:</p>
          <ul style=""margin:0;padding-left:20px;"">
            <li>Pedidos gastronómicos directos sin recargos ocultos.</li>
            <li>Rastreo GPS satelital de tu repartidor en tiempo real.</li>
            <li>Historial de compras y facturación electrónica SRI inmediata.</li>
          </ul>
        </div>

        <div style=""text-align:center;"">
          <a href=""{WebUtility.HtmlEncode(m.LoginUrl)}"" style=""display:inline-block;background-color:{primaryColor};color:#FFFFFF;text-decoration:none;padding:14px 28px;border-radius:9999px;font-weight:900;font-size:13px;text-transform:uppercase;letter-spacing:1px;"">
            Comenzar a Ordenar &rarr;
          </a>
        </div>";

        return BuildBaseHtml(m.Brand, $"Bienvenido a {m.Brand.BrandName}", content);
    }

    private static string RenderWelcomeText(WelcomeEmailModel m)
    {
        return $"¡Bienvenido a {m.Brand.BrandName}, {m.UserName}!\nTu cuenta con el correo {m.UserEmail} ya se encuentra activa.\nInicia sesión aquí: {m.LoginUrl}";
    }

    #endregion

    #region Plantilla 4: Security PIN

    private static string RenderSecurityPinHtml(SecurityPinEmailModel m)
    {
        var primaryColor = string.IsNullOrWhiteSpace(m.Brand.PrimaryColor) ? "#E4002B" : m.Brand.PrimaryColor;

        var content = $@"
        <div style=""text-align:center;margin-bottom:24px;"">
          <h2 style=""margin:0;font-size:22px;font-weight:900;color:#0F172A;"">Código de Verificación</h2>
          <p style=""margin:8px 0 0;font-size:13px;color:#64748B;"">Utiliza el siguiente código para {WebUtility.HtmlEncode(m.Purpose)}:</p>
        </div>

        <div style=""text-align:center;margin:28px 0;"">
          <div style=""display:inline-block;background-color:#F1F5F9;border:2px dashed {primaryColor};padding:14px 32px;border-radius:16px;font-size:32px;font-weight:900;letter-spacing:8px;font-family:monospace;color:#0F172A;"">
            {WebUtility.HtmlEncode(m.PinCode)}
          </div>
          <p style=""margin:12px 0 0;font-size:11px;color:#94A3B8;font-weight:600;"">
            ⚠️ Este código expirará en {m.ExpirationMinutes} minutos por seguridad.
          </p>
        </div>

        <p style=""font-size:12px;color:#64748B;text-align:center;line-height:1.5;"">
          Si tú no solicitaste este código, puedes ignorar este mensaje; tu cuenta permanece completamente protegida.
        </p>";

        return BuildBaseHtml(m.Brand, "Tu Código de Verificación de Seguridad", content);
    }

    private static string RenderSecurityPinText(SecurityPinEmailModel m)
    {
        return $"Hola {m.UserName},\nTu código de verificación para {m.Purpose} es: {m.PinCode}\nExpira en {m.ExpirationMinutes} minutos.\nSi no lo solicitaste, ignora este correo.";
    }

    #endregion

    #region Plantilla 5: Password Reset

    private static string RenderPasswordResetHtml(PasswordResetEmailModel m)
    {
        var primaryColor = string.IsNullOrWhiteSpace(m.Brand.PrimaryColor) ? "#E4002B" : m.Brand.PrimaryColor;

        var content = $@"
        <div style=""text-align:center;margin-bottom:24px;"">
          <div style=""display:inline-block;background-color:#FEE2E2;color:#991B1B;font-size:12px;font-weight:800;padding:6px 14px;border-radius:9999px;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;"">
            Seguridad de la Cuenta
          </div>
          <h2 style=""margin:0;font-size:22px;font-weight:900;color:#0F172A;"">Restablecimiento de Contraseña</h2>
          <p style=""margin:8px 0 0;font-size:13px;color:#64748B;line-height:1.5;"">
            Hola <strong>{WebUtility.HtmlEncode(m.UserName)}</strong>, recibimos una solicitud para cambiar la contraseña de tu cuenta en <strong>{WebUtility.HtmlEncode(m.Brand.BrandName)}</strong>.
          </p>
        </div>

        <div style=""text-align:center;margin:28px 0;"">
          <a href=""{WebUtility.HtmlEncode(m.ResetUrl)}"" style=""display:inline-block;background-color:{primaryColor};color:#FFFFFF;text-decoration:none;padding:14px 32px;border-radius:9999px;font-weight:900;font-size:13px;text-transform:uppercase;letter-spacing:1px;box-shadow:0 4px 10px rgba(0,0,0,0.15);"">
            Restablecer mi Contraseña &rarr;
          </a>
          <p style=""margin:12px 0 0;font-size:12px;color:#94A3B8;font-weight:600;"">
            Este enlace y botón expirarán en {m.ExpirationMinutes} minutos por motivos de seguridad.
          </p>
        </div>

        <div style=""background-color:#FFFBEB;border:1px solid #FEF3C7;border-radius:12px;padding:12px 16px;font-size:12px;color:#B45309;line-height:1.5;margin-bottom:24px;"">
          <strong>Aviso de Seguridad:</strong> Si tú no solicitaste este cambio, puedes ignorar este correo de forma segura. Tu contraseña actual permanecerá intacta y nadie podrá acceder sin tu autorización.
        </div>";

        return BuildBaseHtml(m.Brand, "Restablece tu Contraseña", content);
    }

    private static string RenderPasswordResetText(PasswordResetEmailModel m)
    {
        return $"Hola {m.UserName},\n\nHemos recibido una solicitud para restablecer tu contraseña en {m.Brand.BrandName}.\n\nPara crear una nueva contraseña, haz clic en el siguiente enlace:\n{m.ResetUrl}\n\nEste enlace expirará en {m.ExpirationMinutes} minutos.\nSi no realizaste esta solicitud, ignora este mensaje y tu cuenta permanecerá segura.";
    }

    #endregion

    #region Plantilla 6: Email Verification

    private static string RenderEmailVerificationHtml(EmailVerificationEmailModel m)
    {
        var primaryColor = string.IsNullOrWhiteSpace(m.Brand.PrimaryColor) ? "#E4002B" : m.Brand.PrimaryColor;

        var content = $@"
        <div style=""text-align:center;margin-bottom:24px;"">
          <div style=""display:inline-block;background-color:#F1F5F9;color:#334155;font-size:12px;font-weight:800;padding:6px 14px;border-radius:9999px;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;"">
            Verificación de Cuenta
          </div>
          <h2 style=""margin:0;font-size:24px;font-weight:900;color:#0F172A;text-transform:uppercase;letter-spacing:-0.5px;"">Verifica tu Correo Electrónico</h2>
          <p style=""margin:8px 0 0;font-size:14px;color:#475569;line-height:1.5;"">
            Hola <strong>{WebUtility.HtmlEncode(m.UserName)}</strong>, gracias por registrarte en {WebUtility.HtmlEncode(m.Brand.BrandName)}. Para garantizar la seguridad de tu cuenta y habilitar pedidos y notificaciones en tiempo real, por favor confirma tu dirección de correo electrónico.
          </p>
        </div>

        <div style=""text-align:center;margin:28px 0;"">
          <a href=""{WebUtility.HtmlEncode(m.VerificationUrl)}"" style=""display:inline-block;background-color:{primaryColor};color:#FFFFFF;text-decoration:none;padding:14px 32px;border-radius:9999px;font-weight:900;font-size:13px;text-transform:uppercase;letter-spacing:1px;box-shadow:0 4px 10px rgba(0,0,0,0.15);"">
            Verificar mi Correo &rarr;
          </a>
          <p style=""margin:12px 0 0;font-size:12px;color:#94A3B8;font-weight:600;"">
            Este botón expirará en {m.ExpirationMinutes / 60} horas por motivos de seguridad.
          </p>
        </div>

        <div style=""background-color:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:12px 16px;font-size:12px;color:#64748B;line-height:1.5;"">
          <strong>Aviso de Privacidad:</strong> Si no reconoces haber creado una cuenta con {WebUtility.HtmlEncode(m.Brand.BrandName)}, puedes desestimar este mensaje de forma segura.
        </div>";

        return BuildBaseHtml(m.Brand, "Verifica tu Correo Electrónico", content);
    }

    private static string RenderEmailVerificationText(EmailVerificationEmailModel m)
    {
        return $"Hola {m.UserName},\n\nGracias por registrarte en {m.Brand.BrandName}.\n\nPara verificar tu correo electrónico, haz clic en el siguiente enlace:\n{m.VerificationUrl}\n\nEste enlace expirará en {m.ExpirationMinutes / 60} horas.\nSi no creaste una cuenta, puedes ignorar este mensaje.";
    }

    #endregion

    #region Plantilla 7: Test Email

    private static string RenderTestEmailHtml(TestEmailModel m)
    {
        var primaryColor = string.IsNullOrWhiteSpace(m.Brand.PrimaryColor) ? "#E4002B" : m.Brand.PrimaryColor;

        var content = $@"
        <div style=""text-align:center;margin-bottom:24px;"">
          <div style=""display:inline-block;background-color:#DCFCE7;color:#166534;font-size:12px;font-weight:800;padding:6px 14px;border-radius:9999px;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;"">
            &bull; Prueba de Conexión Exitosa
          </div>
          <h2 style=""margin:0;font-size:22px;font-weight:900;color:#0F172A;"">Infraestructura SMTP Operativa</h2>
          <p style=""margin:6px 0 0;font-size:13px;color:#64748B;"">El servidor de correo fue configurado correctamente y responde sin anomalías.</p>
        </div>

        <div style=""background-color:#F8FAFC;border:1px solid #E2E8F0;border-radius:16px;padding:16px 20px;font-size:12px;color:#334155;line-height:1.7;"">
          <div style=""font-weight:800;color:#0F172A;margin-bottom:6px;text-transform:uppercase;font-size:11px;"">Parámetros del Handshake SMTP:</div>
          <div>&bull; <strong>Servidor Host:</strong> <code>{WebUtility.HtmlEncode(m.SmtpHost)}</code></div>
          <div>&bull; <strong>Puerto:</strong> <code>{m.SmtpPort}</code></div>
          <div>&bull; <strong>Cifrado SSL/TLS:</strong> <code>{(m.SslEnabled ? "Activo (STARTTLS/SSL)" : "Inactivo")}</code></div>
          <div>&bull; <strong>Remitente Oficial:</strong> <code>{WebUtility.HtmlEncode(m.SenderEmail)}</code></div>
          <div>&bull; <strong>Entorno:</strong> <code>{WebUtility.HtmlEncode(m.EnvironmentName)}</code></div>
          <div>&bull; <strong>Fecha y Hora:</strong> <code>{m.SentAt:yyyy-MM-dd HH:mm:ss} UTC</code></div>
        </div>";

        return BuildBaseHtml(m.Brand, "Prueba de Diagnóstico SMTP", content);
    }

    private static string RenderTestEmailText(TestEmailModel m)
    {
        return $"Prueba SMTP Exitosa en {m.Brand.BrandName}.\nServidor: {m.SmtpHost}:{m.SmtpPort}\nSSL: {m.SslEnabled}\nRemitente: {m.SenderEmail}\nFecha: {m.SentAt:u}";
    }

    #endregion
}
