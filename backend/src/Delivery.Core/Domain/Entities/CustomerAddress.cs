namespace Delivery.Core.Domain.Entities;

public class CustomerAddress
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public string Title { get; set; } = "Casa";
    public string Street { get; set; } = string.Empty;
    public string Reference { get; set; } = string.Empty;
    public string City { get; set; } = "Quito";
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public bool IsDefault { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
