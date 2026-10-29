namespace Delivery.Core.Domain.Entities;

public class Role
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    public const int SuperAdmin = 1;
    public const int TenantAdmin = 2;
    public const int BranchManager = 3;
    public const int Cashier = 4;
    public const int KitchenStaff = 5;
    public const int Driver = 6;
    public const int Customer = 7;
}

