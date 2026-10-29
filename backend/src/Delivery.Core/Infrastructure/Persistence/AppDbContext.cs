using Delivery.Core.Domain.Common;
using Delivery.Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Core.Infrastructure.Persistence;

public partial class AppDbContext : DbContext
{
    private readonly ITenantContext? _tenantContext;

    public Guid? CurrentTenantId => _tenantContext?.TenantId;

    public AppDbContext(DbContextOptions<AppDbContext> options, ITenantContext? tenantContext = null)
        : base(options)
    {
        _tenantContext = tenantContext;
    }

    // Núcleo Multitenant
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<TenantSetting> TenantSettings => Set<TenantSetting>();

    // Seguridad & RBAC
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    // Sucursales, Salón y Geocercas
    public DbSet<Branch> Branches => Set<Branch>();
    public DbSet<DiningTable> DiningTables => Set<DiningTable>();

    // Turnos de Caja y Gastos Menores
    public DbSet<CashShift> CashShifts => Set<CashShift>();
    public DbSet<CashTransaction> CashTransactions => Set<CashTransaction>();

    // Catálogo, Recetas e Insumos
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<BranchProduct> BranchProducts => Set<BranchProduct>();
    public DbSet<ModifierGroup> ModifierGroups => Set<ModifierGroup>();
    public DbSet<ProductModifierGroup> ProductModifierGroups => Set<ProductModifierGroup>();
    public DbSet<ModifierOption> ModifierOptions => Set<ModifierOption>();
    public DbSet<InventoryItem> InventoryItems => Set<InventoryItem>();
    public DbSet<ProductRecipe> ProductRecipes => Set<ProductRecipe>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<InventoryMovement> InventoryMovements => Set<InventoryMovement>();

    // Clientes, Pedidos, Despacho y Facturación SRI
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<OrderItemModifier> OrderItemModifiers => Set<OrderItemModifier>();
    public DbSet<Invoice> Invoices => Set<Invoice>();

    // Repartidores y Telemetría
    public DbSet<Driver> Drivers => Set<Driver>();
    public DbSet<OrderDelivery> OrderDeliveries => Set<OrderDelivery>();

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        ApplyTenantIds();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        ApplyTenantIds();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    private void ApplyTenantIds()
    {
        if (!CurrentTenantId.HasValue) return;

        foreach (var entry in ChangeTracker.Entries<IMustHaveTenant>())
        {
            if (entry.State == EntityState.Added && entry.Entity.TenantId == Guid.Empty)
            {
                entry.Entity.TenantId = CurrentTenantId.Value;
            }
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.HasPostgresExtension("postgis");
        modelBuilder.HasPostgresExtension("uuid-ossp");

        ConfigureCoreAndOperations(modelBuilder);
        ConfigureCatalogAndOrders(modelBuilder);
    }
}
