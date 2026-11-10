using System.Text.Json.Serialization;

namespace Delivery.Features.Chatbot.WhatsAppWebhook;

public class WhatsAppWebhookPayload
{
    [JsonPropertyName("object")]
    public string ObjectType { get; set; } = string.Empty;

    [JsonPropertyName("entry")]
    public List<WhatsAppEntry>? Entry { get; set; }
}

public class WhatsAppEntry
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("changes")]
    public List<WhatsAppChange>? Changes { get; set; }
}

public class WhatsAppChange
{
    [JsonPropertyName("field")]
    public string Field { get; set; } = string.Empty;

    [JsonPropertyName("value")]
    public WhatsAppValue? Value { get; set; }
}

public class WhatsAppValue
{
    [JsonPropertyName("messaging_product")]
    public string MessagingProduct { get; set; } = "whatsapp";

    [JsonPropertyName("metadata")]
    public WhatsAppMetadata? Metadata { get; set; }

    [JsonPropertyName("contacts")]
    public List<WhatsAppContact>? Contacts { get; set; }

    [JsonPropertyName("messages")]
    public List<WhatsAppIncomingMessage>? Messages { get; set; }
}

public class WhatsAppMetadata
{
    [JsonPropertyName("display_phone_number")]
    public string DisplayPhoneNumber { get; set; } = string.Empty;

    [JsonPropertyName("phone_number_id")]
    public string PhoneNumberId { get; set; } = string.Empty;
}

public class WhatsAppContact
{
    [JsonPropertyName("profile")]
    public WhatsAppProfile? Profile { get; set; }

    [JsonPropertyName("wa_id")]
    public string WaId { get; set; } = string.Empty;
}

public class WhatsAppProfile
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
}

public class WhatsAppIncomingMessage
{
    [JsonPropertyName("from")]
    public string From { get; set; } = string.Empty;

    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("timestamp")]
    public string Timestamp { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("text")]
    public WhatsAppTextMessage? Text { get; set; }
}

public class WhatsAppTextMessage
{
    [JsonPropertyName("body")]
    public string Body { get; set; } = string.Empty;
}

public class ChatMessageDto
{
    public string Role { get; set; } = "user";
    public string Content { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

