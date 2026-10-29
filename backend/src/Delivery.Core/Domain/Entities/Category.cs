using Delivery.Core.Domain.Common;

namespace Delivery.Core.Domain.Entities;

public class Category : IMustHaveTenant
{
    public int Id { get; set; }
    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;

    // Navegación
    public ICollection<Product> Products { get; set; } = new List<Product>();
}

