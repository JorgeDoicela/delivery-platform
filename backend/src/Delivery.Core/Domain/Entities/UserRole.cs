namespace Delivery.Core.Domain.Entities;

public class UserRole
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public int RoleId { get; set; }
    public Role Role { get; set; } = null!;

    public int? BranchId { get; set; }
    public Branch? Branch { get; set; }
}

