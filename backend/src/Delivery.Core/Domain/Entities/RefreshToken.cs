namespace Delivery.Core.Domain.Entities;

public class RefreshToken
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public string TokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public string CreatedByIp { get; set; } = string.Empty;

    public bool IsActive => RevokedAt == null && DateTime.UtcNow < ExpiresAt;
}

