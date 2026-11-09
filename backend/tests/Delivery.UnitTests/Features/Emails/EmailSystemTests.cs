using System.Net;
using Delivery.Core.Contracts.Emails;
using Delivery.Core.Contracts.Emails.Models;
using Delivery.Core.Infrastructure.Emails;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Services;
using Delivery.Features.Emails.SendTestEmail;
using FluentAssertions;
using Hangfire;
using Hangfire.States;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace Delivery.UnitTests.Features.Emails;

public class EmailSystemTests
{
    [Fact]
    public void SmtpOptions_DefaultValues_ShouldBeStandard()
    {
        var options = new SmtpOptions();

        options.Port.Should().Be(587);
        options.EnableSsl.Should().BeTrue();
        options.TimeoutSeconds.Should().Be(15);
        options.SenderEmail.Should().Be("no-reply@mesafy.doicela.dev");
        options.IsConfigured.Should().BeFalse();
        options.RequireAuthentication.Should().BeFalse();
    }

    [Fact]
    public void SmtpOptions_WhenConfigured_ShouldDetectHostAndAuth()
    {
        var options = new SmtpOptions
        {
            Host = "smtp.gmail.com",
            Port = 587,
            UserName = "user@gmail.com",
            Password = "app-password"
        };

        options.IsConfigured.Should().BeTrue();
        options.RequireAuthentication.Should().BeTrue();
    }

    [Theory]
    [InlineData("cliente@gmail.com", "Cliente Uno")]
    [InlineData("pedidos@la-granjita.com", null)]
    public void EmailRecipient_ValidEmail_ShouldInstantiate(string email, string? name)
    {
        var recipient = new EmailRecipient(email, name);

        recipient.Email.Should().Be(email);
        recipient.Name.Should().Be(name);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("correo-invalido")]
    [InlineData("@dominio.com")]
    [InlineData("usuario@")]
    public void EmailRecipient_InvalidEmail_ShouldThrowArgumentException(string email)
    {
        var act = () => new EmailRecipient(email);
        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void HtmlEmailTemplateEngine_RenderOrderConfirmation_ShouldContainDetails()
    {
        var engine = new HtmlEmailTemplateEngine();
        var model = new OrderConfirmationEmailModel
        {
            Brand = new BrandEmailContext
            {
                BrandName = "La Granjita",
                PrimaryColor = "#D90429"
            },
            OrderNumber = 1042,
            OrderId = Guid.NewGuid(),
            CustomerName = "Carlos Mendoza",
            BranchName = "Sucursal Norte",
            AddressStreet = "Av. América y Mariana de Jesús",
            PaymentMethod = "Efectivo",
            EstimatedDeliveryTime = "35-45 min",
            TrackingUrl = "https://mesafy.doicela.dev/la-granjita/rastreo/1042",
            Items =
            [
                new OrderItemEmailDto("Combo 1 Pollo", 1, 15.00m, 15.00m, "Papas familiares, cola 2L")
            ],
            Subtotal = 15.00m,
            DeliveryFee = 1.50m,
            Total = 16.50m
        };

        var (html, text) = engine.Render(EmailTemplateType.OrderConfirmation, model);

        html.Should().Contain("La Granjita");
        html.Should().Contain("#1042");
        html.Should().Contain("Carlos Mendoza");
        html.Should().Contain("Combo 1 Pollo");
        html.Should().Contain("$16.50");
        html.Should().Contain(model.TrackingUrl);

        text.Should().Contain("#1042");
        text.Should().Contain("Carlos Mendoza");
    }

    [Fact]
    public void HtmlEmailTemplateEngine_RenderOrderStatusChanged_ShouldContainStatus()
    {
        var engine = new HtmlEmailTemplateEngine();
        var model = new OrderStatusChangedEmailModel
        {
            Brand = new BrandEmailContext { BrandName = "La Granjita" },
            OrderNumber = 1042,
            OrderId = Guid.NewGuid(),
            CustomerName = "Carlos",
            PreviousStatus = "InKitchen",
            CurrentStatus = "OnTheWay",
            StatusTitle = "¡El repartidor va en camino!",
            StatusDescription = "Tu pedido se dirige a tu dirección con GPS activo.",
            TrackingUrl = "https://mesafy.doicela.dev/la-granjita/rastreo/1042",
            Total = 16.50m
        };

        var (html, text) = engine.Render(EmailTemplateType.OrderStatusChanged, model);

        WebUtility.HtmlDecode(html).Should().Contain("¡El repartidor va en camino!");
        html.Should().Contain("OnTheWay");
        html.Should().Contain(model.TrackingUrl);

        text.Should().Contain("OnTheWay");
    }

    [Fact]
    public void HtmlEmailTemplateEngine_RenderWelcomeUser_ShouldContainCredentials()
    {
        var engine = new HtmlEmailTemplateEngine();
        var model = new WelcomeEmailModel
        {
            Brand = new BrandEmailContext { BrandName = "Mesafy" },
            UserName = "María López",
            UserEmail = "maria@test.com",
            LoginUrl = "https://mesafy.doicela.dev/login"
        };

        var (html, text) = engine.Render(EmailTemplateType.WelcomeUser, model);

        WebUtility.HtmlDecode(html).Should().Contain("María López");
        html.Should().Contain("maria@test.com");
        html.Should().Contain(model.LoginUrl);

        text.Should().Contain("maria@test.com");
    }

    [Fact]
    public void HtmlEmailTemplateEngine_RenderSecurityPin_ShouldContainPinCode()
    {
        var engine = new HtmlEmailTemplateEngine();
        var model = new SecurityPinEmailModel
        {
            UserName = "David",
            PinCode = "482915",
            ExpirationMinutes = 10,
            Purpose = "verificar tu inicio de sesión"
        };

        var (html, text) = engine.Render(EmailTemplateType.SecurityPin, model);

        html.Should().Contain("482915");
        html.Should().Contain("10 minutos");

        text.Should().Contain("482915");
    }

    [Fact]
    public void HtmlEmailTemplateEngine_RenderTestEmail_ShouldContainSmtpParameters()
    {
        var engine = new HtmlEmailTemplateEngine();
        var model = new TestEmailModel
        {
            SmtpHost = "smtp.gmail.com",
            SmtpPort = 587,
            SslEnabled = true,
            SenderEmail = "no-reply@mesafy.doicela.dev",
            EnvironmentName = "Testing"
        };

        var (html, text) = engine.Render(EmailTemplateType.TestEmail, model);

        html.Should().Contain("smtp.gmail.com");
        html.Should().Contain("587");
        html.Should().Contain("no-reply@mesafy.doicela.dev");

        text.Should().Contain("smtp.gmail.com");
    }

    [Fact]
    public async Task MailKitSmtpEmailService_WhenHostUnconfigured_ShouldSimulateInDevWithoutThrowing()
    {
        var options = Options.Create(new SmtpOptions { Host = "" });
        var engine = new HtmlEmailTemplateEngine();
        var service = new MailKitSmtpEmailService(options, engine, NullLogger<MailKitSmtpEmailService>.Instance);

        var message = new EmailMessage("test@dominio.com", "Asunto de prueba", "<p>Hola</p>");

        var result = await service.SendEmailAsync(message);

        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task MailKitSmtpEmailService_WhenNoRecipients_ShouldReturnFailure()
    {
        var options = Options.Create(new SmtpOptions());
        var engine = new HtmlEmailTemplateEngine();
        var service = new MailKitSmtpEmailService(options, engine, NullLogger<MailKitSmtpEmailService>.Instance);

        var message = new EmailMessage { Subject = "Asunto", HtmlBody = "<p>Contenido</p>" };

        var result = await service.SendEmailAsync(message);

        result.IsSuccess.Should().BeFalse();
        result.Error.Code.Should().Be(EmailErrors.NoRecipients.Code);
    }

    [Fact]
    public async Task SendTestEmailHandler_ValidRequest_ShouldReturnSuccess()
    {
        var options = Options.Create(new SmtpOptions { Host = "" });
        var engine = new HtmlEmailTemplateEngine();
        var emailService = new MailKitSmtpEmailService(options, engine, NullLogger<MailKitSmtpEmailService>.Instance);

        var dbOptions = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        using var context = new AppDbContext(dbOptions);

        var mockEnv = new Mock<IHostEnvironment>();
        mockEnv.Setup(e => e.EnvironmentName).Returns("Development");

        var handler = new SendTestEmailHandler(emailService, options, context, mockEnv.Object);
        var request = new SendTestEmailRequest("admin@mesafy.doicela.dev", "Admin Principal");

        var result = await handler.Handle(request);

        result.IsSuccess.Should().BeTrue();
        result.Value.Success.Should().BeTrue();
        result.Value.SmtpPort.Should().Be(587);
    }

    [Fact]
    public void HangfireBackgroundEmailQueue_EnqueueEmail_ShouldCallBackgroundJobClient()
    {
        var mockJobClient = new Mock<IBackgroundJobClient>();
        var queue = new HangfireBackgroundEmailQueue(mockJobClient.Object);
        var message = new EmailMessage("cliente@test.com", "Asunto", "<p>Cuerpo</p>");

        queue.EnqueueEmail(message);

        mockJobClient.Verify(c => c.Create(
            It.IsAny<Hangfire.Common.Job>(),
            It.Is<EnqueuedState>(s => s.Queue == "notifications")
        ), Times.Once);
    }
}
