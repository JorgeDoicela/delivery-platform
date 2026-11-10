using Delivery.Core.Domain.Entities;
using Delivery.Features.Chatbot.WhatsAppWebhook;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace Delivery.UnitTests.Features.Chatbot;

public class WhatsAppWebhookProcessorTests
{
    private readonly Mock<ITenantKnowledgeProvider> _knowledgeMock;
    private readonly Mock<IConversationStore> _storeMock;
    private readonly Mock<ICustomerConsentTracker> _consentMock;
    private readonly Mock<IChatbotAiEngine> _aiMock;
    private readonly Mock<IWhatsAppClient> _senderMock;
    private readonly Mock<ILogger<WhatsAppWebhookProcessor>> _loggerMock;
    private readonly WhatsAppWebhookProcessor _processor;
    private readonly WhatsAppChatbotOptions _options;

    public WhatsAppWebhookProcessorTests()
    {
        _knowledgeMock = new Mock<ITenantKnowledgeProvider>();
        _storeMock = new Mock<IConversationStore>();
        _consentMock = new Mock<ICustomerConsentTracker>();
        _aiMock = new Mock<IChatbotAiEngine>();
        _senderMock = new Mock<IWhatsAppClient>();
        _loggerMock = new Mock<ILogger<WhatsAppWebhookProcessor>>();

        _options = new WhatsAppChatbotOptions
        {
            PlatformDomain = "mesafy.doicela.dev"
        };
        var optionsMock = Options.Create(_options);

        // Por defecto, asumir consentimiento activo para no romper pruebas de flujo conversacional
        _consentMock.Setup(c => c.HasConsentAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _processor = new WhatsAppWebhookProcessor(
            _knowledgeMock.Object,
            _storeMock.Object,
            _consentMock.Object,
            _aiMock.Object,
            _senderMock.Object,
            optionsMock,
            _loggerMock.Object);
    }

    [Fact]
    public async Task ProcessPayloadAsync_WhenMessageAlreadyProcessed_SkipsExecution()
    {
        // Arrange
        var messageId = "wamid.123456";
        _storeMock.Setup(s => s.IsMessageProcessedAsync(messageId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var payload = CreateSingleMessagePayload(messageId, "593987654321", "Hola");

        // Act
        await _processor.ProcessPayloadAsync(payload);

        // Assert
        _senderMock.Verify(s => s.SendTextMessageAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()), Times.Never);
        _aiMock.Verify(a => a.GenerateReplyAsync(It.IsAny<string>(), It.IsAny<List<ChatMessageDto>>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ProcessPayloadAsync_WithValidTextMessage_GeneratesAndSendsReply()
    {
        // Arrange
        var messageId = "wamid.unique_msg_789";
        var senderPhone = "593987654321";
        var userText = "¿Qué combos de asado tienen?";
        var tenant = new Tenant { Id = Guid.NewGuid(), Name = "La Granjita", Slug = "la-granjita" };

        _storeMock.Setup(s => s.IsMessageProcessedAsync(messageId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _knowledgeMock.Setup(k => k.ResolveContextAsync(It.IsAny<string>(), userText, It.IsAny<string?>(), It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantChatContext
            {
                Tenant = tenant,
                SystemPrompt = "System prompt test"
            });

        _storeMock.Setup(s => s.GetHistoryAsync(tenant.Id, senderPhone, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<ChatMessageDto>());

        _aiMock.Setup(a => a.GenerateReplyAsync("System prompt test", It.IsAny<List<ChatMessageDto>>(), userText, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync("Tenemos combo personal a $6.50 y combo familiar a $18.00.");

        _senderMock.Setup(s => s.SendTextMessageAsync(senderPhone, It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var payload = CreateSingleMessagePayload(messageId, senderPhone, userText);

        // Act
        await _processor.ProcessPayloadAsync(payload);

        // Assert
        _senderMock.Verify(s => s.MarkMessageAsReadAsync(messageId, It.IsAny<string?>(), It.IsAny<CancellationToken>()), Times.Once);
        _senderMock.Verify(s => s.SendTextMessageAsync(senderPhone, "Tenemos combo personal a $6.50 y combo familiar a $18.00.", It.IsAny<string?>(), It.IsAny<CancellationToken>()), Times.Once);
        _storeMock.Verify(s => s.AppendMessageAsync(tenant.Id, senderPhone, It.Is<ChatMessageDto>(m => m.Role == "user" && m.Content == userText), It.IsAny<CancellationToken>()), Times.Once);
        _storeMock.Verify(s => s.AppendMessageAsync(tenant.Id, senderPhone, It.Is<ChatMessageDto>(m => m.Role == "assistant" && m.Content.Contains("combo")), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ProcessPayloadAsync_WithNonTextMessage_SendsPoliteClarification()
    {
        // Arrange
        var messageId = "wamid.audio_123";
        var senderPhone = "593987654321";

        _storeMock.Setup(s => s.IsMessageProcessedAsync(messageId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var payload = new WhatsAppWebhookPayload
        {
            Entry = new List<WhatsAppEntry>
            {
                new WhatsAppEntry
                {
                    Changes = new List<WhatsAppChange>
                    {
                        new WhatsAppChange
                        {
                            Value = new WhatsAppValue
                            {
                                Messages = new List<WhatsAppIncomingMessage>
                                {
                                    new WhatsAppIncomingMessage
                                    {
                                        Id = messageId,
                                        From = senderPhone,
                                        Type = "image"
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };

        // Act
        await _processor.ProcessPayloadAsync(payload);

        // Assert
        _senderMock.Verify(s => s.SendTextMessageAsync(senderPhone, It.Is<string>(t => t.Contains("solo puedo procesar mensajes de texto")), It.IsAny<string?>(), It.IsAny<CancellationToken>()), Times.Once);
        _aiMock.Verify(a => a.GenerateReplyAsync(It.IsAny<string>(), It.IsAny<List<ChatMessageDto>>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ProcessPayloadAsync_WithActiveSession_PreservesTenantContextAndRefreshesSession()
    {
        // Arrange
        var messageId = "wamid.session_msg_101";
        var senderPhone = "593987654321";
        var userText = "¿A qué hora cierran hoy?";
        var activeTenantId = Guid.NewGuid();
        var tenant = new Tenant { Id = activeTenantId, Name = "Brasas del Valle", Slug = "brasas-del-valle" };

        _storeMock.Setup(s => s.IsMessageProcessedAsync(messageId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _storeMock.Setup(s => s.GetActiveTenantSessionAsync(senderPhone, It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeTenantId);

        _knowledgeMock.Setup(k => k.ResolveContextAsync(It.IsAny<string>(), userText, senderPhone, activeTenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantChatContext
            {
                Tenant = tenant,
                SystemPrompt = "System prompt Brasas del Valle"
            });

        _storeMock.Setup(s => s.GetHistoryAsync(activeTenantId, senderPhone, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<ChatMessageDto>());

        _aiMock.Setup(a => a.GenerateReplyAsync(It.IsAny<string>(), It.IsAny<List<ChatMessageDto>>(), userText, It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("Cerramos a las 22:00.");

        _senderMock.Setup(s => s.SendTextMessageAsync(senderPhone, It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var payload = CreateSingleMessagePayload(messageId, senderPhone, userText);

        // Act
        await _processor.ProcessPayloadAsync(payload);

        // Assert
        _knowledgeMock.Verify(k => k.ResolveContextAsync(It.IsAny<string>(), userText, senderPhone, activeTenantId, It.IsAny<CancellationToken>()), Times.Once);
        _storeMock.Verify(s => s.SetActiveTenantSessionAsync(senderPhone, activeTenantId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ProcessPayloadAsync_WithOrderInquiry_InjectsOrderContextIntoAi()
    {
        // Arrange
        var messageId = "wamid.order_inquiry_202";
        var senderPhone = "593987654321";
        var userText = "¿Cómo va mi pedido #1004?";
        var tenant = new Tenant { Id = Guid.NewGuid(), Name = "La Granjita", Slug = "la-granjita" };
        var orderContext = "INFORMACIÓN OFICIAL DEL PEDIDO #1004:\n- Estado actual: En preparación en cocina";

        _storeMock.Setup(s => s.IsMessageProcessedAsync(messageId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _knowledgeMock.Setup(k => k.ResolveContextAsync(It.IsAny<string>(), userText, senderPhone, It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantChatContext
            {
                Tenant = tenant,
                SystemPrompt = "System prompt"
            });

        _knowledgeMock.Setup(k => k.TryResolveOrderStatusAsync(tenant.Id, senderPhone, userText, It.IsAny<CancellationToken>()))
            .ReturnsAsync(orderContext);

        _storeMock.Setup(s => s.GetHistoryAsync(tenant.Id, senderPhone, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<ChatMessageDto>());

        _aiMock.Setup(a => a.GenerateReplyAsync(It.IsAny<string>(), It.IsAny<List<ChatMessageDto>>(), userText, orderContext, It.IsAny<CancellationToken>()))
            .ReturnsAsync("Tu pedido #1004 se encuentra actualmente en preparación en cocina.");

        _senderMock.Setup(s => s.SendTextMessageAsync(senderPhone, It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var payload = CreateSingleMessagePayload(messageId, senderPhone, userText);

        // Act
        await _processor.ProcessPayloadAsync(payload);

        // Assert
        _aiMock.Verify(a => a.GenerateReplyAsync(It.IsAny<string>(), It.IsAny<List<ChatMessageDto>>(), userText, orderContext, It.IsAny<CancellationToken>()), Times.Once);
        _senderMock.Verify(s => s.SendTextMessageAsync(senderPhone, It.Is<string>(s => s.Contains("1004")), It.IsAny<string?>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ProcessPayloadAsync_WhenBotDisabledForTenant_SendsDisabledNoticeAndSkipsAi()
    {
        // Arrange
        var messageId = "wamid.disabled_tenant_1";
        var senderPhone = "593987654321";
        var userText = "Hola quiero ordenar";
        var tenant = new Tenant
        {
            Id = Guid.NewGuid(),
            Name = "Parrilla del Sur",
            Slug = "parrilla-del-sur",
            ContactPhone = "0991234567",
            Settings = new TenantSetting { EnableWhatsAppBot = false }
        };

        _storeMock.Setup(s => s.IsMessageProcessedAsync(messageId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _knowledgeMock.Setup(k => k.ResolveContextAsync(It.IsAny<string>(), userText, senderPhone, It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantChatContext { Tenant = tenant });

        var payload = CreateSingleMessagePayload(messageId, senderPhone, userText);

        // Act
        await _processor.ProcessPayloadAsync(payload);

        // Assert
        _senderMock.Verify(s => s.SendTextMessageAsync(senderPhone, It.Is<string>(t => t.Contains("no se encuentra disponible temporalmente")), It.IsAny<string?>(), It.IsAny<CancellationToken>()), Times.Once);
        _aiMock.Verify(a => a.GenerateReplyAsync(It.IsAny<string>(), It.IsAny<List<ChatMessageDto>>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ProcessPayloadAsync_WhenConsentRequiredAndNotGiven_SendsLegalNoticeAndSkipsAi()
    {
        // Arrange
        var messageId = "wamid.no_consent_1";
        var senderPhone = "593987654321";
        var userText = "¿Qué tienen en el menú?";
        var tenant = new Tenant
        {
            Id = Guid.NewGuid(),
            Name = "La Granjita",
            Slug = "la-granjita",
            Settings = new TenantSetting { RequireDataProtectionConsent = true }
        };

        _storeMock.Setup(s => s.IsMessageProcessedAsync(messageId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _knowledgeMock.Setup(k => k.ResolveContextAsync(It.IsAny<string>(), userText, senderPhone, It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantChatContext { Tenant = tenant });

        _consentMock.Setup(c => c.HasConsentAsync(tenant.Id, senderPhone, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var payload = CreateSingleMessagePayload(messageId, senderPhone, userText);

        // Act
        await _processor.ProcessPayloadAsync(payload);

        // Assert
        _senderMock.Verify(s => s.SendTextMessageAsync(senderPhone, It.Is<string>(t => t.Contains("Ley Orgánica de Protección de Datos Personales") && t.Contains("ACEPTO")), It.IsAny<string?>(), It.IsAny<CancellationToken>()), Times.Once);
        _aiMock.Verify(a => a.GenerateReplyAsync(It.IsAny<string>(), It.IsAny<List<ChatMessageDto>>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()), Times.Never);
        _consentMock.Verify(c => c.RegisterConsentAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ProcessPayloadAsync_WhenUserRepliesAcepto_RegistersConsentAndSendsWelcome()
    {
        // Arrange
        var messageId = "wamid.accept_consent_1";
        var senderPhone = "593987654321";
        var userText = "ACEPTO";
        var tenant = new Tenant
        {
            Id = Guid.NewGuid(),
            Name = "La Granjita",
            Slug = "la-granjita",
            Settings = new TenantSetting { RequireDataProtectionConsent = true }
        };

        _storeMock.Setup(s => s.IsMessageProcessedAsync(messageId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _knowledgeMock.Setup(k => k.ResolveContextAsync(It.IsAny<string>(), userText, senderPhone, It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantChatContext { Tenant = tenant });

        _consentMock.Setup(c => c.HasConsentAsync(tenant.Id, senderPhone, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var payload = CreateSingleMessagePayload(messageId, senderPhone, userText);

        // Act
        await _processor.ProcessPayloadAsync(payload);

        // Assert
        _consentMock.Verify(c => c.RegisterConsentAsync(tenant.Id, senderPhone, messageId, It.IsAny<CancellationToken>()), Times.Once);
        _senderMock.Verify(s => s.SendTextMessageAsync(senderPhone, It.Is<string>(t => t.Contains("consentimiento para el tratamiento de datos personales")), It.IsAny<string?>(), It.IsAny<CancellationToken>()), Times.Once);
        _aiMock.Verify(a => a.GenerateReplyAsync(It.IsAny<string>(), It.IsAny<List<ChatMessageDto>>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ProcessPayloadAsync_WhenUserRepliesRevocar_RevokesConsentAndSendsConfirmation()
    {
        // Arrange
        var messageId = "wamid.revoke_consent_1";
        var senderPhone = "593987654321";
        var userText = "REVOCAR CONSENTIMIENTO";
        var tenant = new Tenant
        {
            Id = Guid.NewGuid(),
            Name = "La Granjita",
            Slug = "la-granjita",
            Settings = new TenantSetting { RequireDataProtectionConsent = true }
        };

        _storeMock.Setup(s => s.IsMessageProcessedAsync(messageId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _knowledgeMock.Setup(k => k.ResolveContextAsync(It.IsAny<string>(), userText, senderPhone, It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantChatContext { Tenant = tenant });

        var payload = CreateSingleMessagePayload(messageId, senderPhone, userText);

        // Act
        await _processor.ProcessPayloadAsync(payload);

        // Assert
        _consentMock.Verify(c => c.RevokeConsentAsync(tenant.Id, senderPhone, It.IsAny<CancellationToken>()), Times.Once);
        _senderMock.Verify(s => s.SendTextMessageAsync(senderPhone, It.Is<string>(t => t.Contains("ha sido revocado conforme a la LOPDP")), It.IsAny<string?>(), It.IsAny<CancellationToken>()), Times.Once);
        _aiMock.Verify(a => a.GenerateReplyAsync(It.IsAny<string>(), It.IsAny<List<ChatMessageDto>>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    private static WhatsAppWebhookPayload CreateSingleMessagePayload(string messageId, string from, string body)
    {
        return new WhatsAppWebhookPayload
        {
            Entry = new List<WhatsAppEntry>
            {
                new WhatsAppEntry
                {
                    Changes = new List<WhatsAppChange>
                    {
                        new WhatsAppChange
                        {
                            Value = new WhatsAppValue
                            {
                                Metadata = new WhatsAppMetadata
                                {
                                    PhoneNumberId = "1349339028273599"
                                },
                                Contacts = new List<WhatsAppContact>
                                {
                                    new WhatsAppContact
                                    {
                                        Profile = new WhatsAppProfile { Name = "Jorge Doicela" },
                                        WaId = from
                                    }
                                },
                                Messages = new List<WhatsAppIncomingMessage>
                                {
                                    new WhatsAppIncomingMessage
                                    {
                                        Id = messageId,
                                        From = from,
                                        Type = "text",
                                        Text = new WhatsAppTextMessage { Body = body }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };
    }
}
