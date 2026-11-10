using Delivery.Core.Domain.Entities;
using Delivery.Features.Chatbot.WhatsAppWebhook;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Delivery.UnitTests.Features.Chatbot;

public class WhatsAppWebhookProcessorTests
{
    private readonly Mock<ITenantKnowledgeProvider> _knowledgeMock;
    private readonly Mock<IConversationStore> _storeMock;
    private readonly Mock<IChatbotAiEngine> _aiMock;
    private readonly Mock<IWhatsAppClient> _senderMock;
    private readonly Mock<ILogger<WhatsAppWebhookProcessor>> _loggerMock;
    private readonly WhatsAppWebhookProcessor _processor;

    public WhatsAppWebhookProcessorTests()
    {
        _knowledgeMock = new Mock<ITenantKnowledgeProvider>();
        _storeMock = new Mock<IConversationStore>();
        _aiMock = new Mock<IChatbotAiEngine>();
        _senderMock = new Mock<IWhatsAppClient>();
        _loggerMock = new Mock<ILogger<WhatsAppWebhookProcessor>>();

        _processor = new WhatsAppWebhookProcessor(
            _knowledgeMock.Object,
            _storeMock.Object,
            _aiMock.Object,
            _senderMock.Object,
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

        _knowledgeMock.Setup(k => k.ResolveContextAsync(It.IsAny<string>(), userText, It.IsAny<CancellationToken>()))
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
