using Delivery.Core.Domain.Common;

namespace Delivery.Core.Domain.Entities;

public class CashShift : IMustHaveTenant
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    public int BranchId { get; set; }
    public Branch Branch { get; set; } = null!;

    public Guid CashierUserId { get; set; }
    public User CashierUser { get; set; } = null!;

    public DateTime OpenedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ClosedAt { get; set; }

    public decimal InitialCashAmount { get; set; }
    public decimal CashSalesTotal { get; set; }
    public decimal TransferSalesTotal { get; set; }
    public decimal CashoutTotal { get; set; }
    public decimal? FinalCountedCash { get; set; }
    public decimal? Difference { get; set; }

    public bool IsClosed => ClosedAt.HasValue;

    // Navegación
    public ICollection<CashTransaction> Transactions { get; set; } = new List<CashTransaction>();
    public ICollection<Order> Orders { get; set; } = new List<Order>();
}

