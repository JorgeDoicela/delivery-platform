using Delivery.Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Core.Infrastructure.Persistence;

public partial class AppDbContext
{
    private void ConfigureCatalogAndOrders(ModelBuilder modelBuilder)
    {
        // -------------------------------------------------------------
        // 5. Catálogo, Modificadores, Recetas e Insumos
        // -------------------------------------------------------------
        modelBuilder.Entity<Category>(c =>
        {
            c.ToTable("Categories");
            c.HasKey(x => x.Id);
            c.Property(x => x.Name).HasMaxLength(100).IsRequired();

            c.HasOne(x => x.Tenant)
                .WithMany(x => x.Categories)
                .HasForeignKey(x => x.TenantId)
                .OnDelete(DeleteBehavior.Cascade);

            c.HasQueryFilter(x => CurrentTenantId == null || x.TenantId == CurrentTenantId);
        });

        modelBuilder.Entity<Product>(p =>
        {
            p.ToTable("Products");
            p.HasKey(x => x.Id);
            p.Property(x => x.Sku).HasMaxLength(50);
            p.Property(x => x.Name).HasMaxLength(150).IsRequired();
            p.Property(x => x.Description).HasMaxLength(500);
            p.Property(x => x.BasePrice).HasPrecision(18, 2);
            p.Property(x => x.TaxRate).HasPrecision(5, 2);
            p.Property(x => x.Category).HasMaxLength(100);
            p.Property(x => x.ImageUrl).HasMaxLength(500);

            p.HasOne(x => x.Tenant)
                .WithMany(x => x.Products)
                .HasForeignKey(x => x.TenantId)
                .OnDelete(DeleteBehavior.Cascade);

            p.HasOne(x => x.CategoryEntity)
                .WithMany(x => x.Products)
                .HasForeignKey(x => x.CategoryId)
                .OnDelete(DeleteBehavior.SetNull);

            p.HasQueryFilter(x => CurrentTenantId == null || x.TenantId == CurrentTenantId);
        });

        modelBuilder.Entity<BranchProduct>(bp =>
        {
            bp.ToTable("BranchProducts");
            bp.HasKey(x => new { x.BranchId, x.ProductId });
            bp.Property(x => x.CustomPrice).HasPrecision(18, 2);

            bp.HasOne(x => x.Tenant)
                .WithMany()
                .HasForeignKey(x => x.TenantId)
                .OnDelete(DeleteBehavior.Cascade);

            bp.HasOne(x => x.Branch)
                .WithMany(x => x.BranchProducts)
                .HasForeignKey(x => x.BranchId)
                .OnDelete(DeleteBehavior.Cascade);

            bp.HasOne(x => x.Product)
                .WithMany(x => x.BranchProducts)
                .HasForeignKey(x => x.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            bp.HasQueryFilter(x => CurrentTenantId == null || x.TenantId == CurrentTenantId);
        });

        modelBuilder.Entity<ModifierGroup>(mg =>
        {
            mg.ToTable("ModifierGroups");
            mg.HasKey(x => x.Id);
            mg.Property(x => x.Name).HasMaxLength(150).IsRequired();

            mg.HasQueryFilter(x => CurrentTenantId == null || x.TenantId == CurrentTenantId);
        });

        modelBuilder.Entity<ProductModifierGroup>(pmg =>
        {
            pmg.ToTable("ProductModifierGroups");
            pmg.HasKey(x => new { x.ProductId, x.ModifierGroupId });

            pmg.HasOne(x => x.Product)
                .WithMany(x => x.ProductModifierGroups)
                .HasForeignKey(x => x.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            pmg.HasOne(x => x.ModifierGroup)
                .WithMany(x => x.ProductModifierGroups)
                .HasForeignKey(x => x.ModifierGroupId)
                .OnDelete(DeleteBehavior.Cascade);

            pmg.HasQueryFilter(x => CurrentTenantId == null || x.Product.TenantId == CurrentTenantId);
        });

        modelBuilder.Entity<ModifierOption>(mo =>
        {
            mo.ToTable("ModifierOptions");
            mo.HasKey(x => x.Id);
            mo.Property(x => x.Name).HasMaxLength(150).IsRequired();
            mo.Property(x => x.AdditionalPrice).HasPrecision(18, 2);

            mo.HasOne(x => x.ModifierGroup)
                .WithMany(x => x.Options)
                .HasForeignKey(x => x.ModifierGroupId)
                .OnDelete(DeleteBehavior.Cascade);

            mo.HasQueryFilter(x => CurrentTenantId == null || x.ModifierGroup.TenantId == CurrentTenantId);
        });

        modelBuilder.Entity<InventoryItem>(ii =>
        {
            ii.ToTable("InventoryItems");
            ii.HasKey(x => x.Id);
            ii.Property(x => x.Sku).HasMaxLength(50).IsRequired();
            ii.Property(x => x.Name).HasMaxLength(150).IsRequired();
            ii.Property(x => x.UnitOfMeasure).HasMaxLength(50).IsRequired();
            ii.Property(x => x.CurrentStock).HasPrecision(18, 3);
            ii.Property(x => x.MinAlertStock).HasPrecision(18, 3);
            ii.Property(x => x.CostPrice).HasPrecision(18, 2);

            ii.HasIndex(x => new { x.TenantId, x.BranchId, x.Sku }).IsUnique();

            ii.HasOne(x => x.Branch)
                .WithMany()
                .HasForeignKey(x => x.BranchId)
                .OnDelete(DeleteBehavior.Cascade);

            ii.HasQueryFilter(x => CurrentTenantId == null || x.TenantId == CurrentTenantId);
        });

        modelBuilder.Entity<ProductRecipe>(pr =>
        {
            pr.ToTable("ProductRecipes");
            pr.HasKey(x => x.Id);
            pr.Property(x => x.QuantityUsed).HasPrecision(18, 3);

            pr.HasOne(x => x.Product)
                .WithMany(x => x.Recipes)
                .HasForeignKey(x => x.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            pr.HasOne(x => x.InventoryItem)
                .WithMany(x => x.ProductRecipes)
                .HasForeignKey(x => x.InventoryItemId)
                .OnDelete(DeleteBehavior.Cascade);

            pr.HasQueryFilter(x => CurrentTenantId == null || x.Product.TenantId == CurrentTenantId);
        });

        modelBuilder.Entity<Supplier>(s =>
        {
            s.ToTable("Suppliers");
            s.HasKey(x => x.Id);
            s.Property(x => x.Name).HasMaxLength(150).IsRequired();
            s.Property(x => x.TaxId).HasMaxLength(20);
            s.Property(x => x.Phone).HasMaxLength(30);
            s.Property(x => x.Email).HasMaxLength(150);
            s.Property(x => x.Address).HasMaxLength(300);

            s.HasOne(x => x.Tenant)
                .WithMany()
                .HasForeignKey(x => x.TenantId)
                .OnDelete(DeleteBehavior.Cascade);

            s.HasQueryFilter(x => CurrentTenantId == null || x.TenantId == CurrentTenantId);
        });

        modelBuilder.Entity<InventoryMovement>(im =>
        {
            im.ToTable("InventoryMovements");
            im.HasKey(x => x.Id);
            im.Property(x => x.MovementType).HasMaxLength(50).IsRequired();
            im.Property(x => x.QuantityDelta).HasPrecision(18, 3);
            im.Property(x => x.StockBefore).HasPrecision(18, 3);
            im.Property(x => x.StockAfter).HasPrecision(18, 3);
            im.Property(x => x.UnitCostSnapshot).HasPrecision(18, 2);
            im.Property(x => x.Notes).HasMaxLength(300);

            im.HasOne(x => x.InventoryItem)
                .WithMany(x => x.Movements)
                .HasForeignKey(x => x.InventoryItemId)
                .OnDelete(DeleteBehavior.Cascade);

            im.HasOne(x => x.Supplier)
                .WithMany(x => x.Movements)
                .HasForeignKey(x => x.SupplierId)
                .OnDelete(DeleteBehavior.SetNull);

            im.HasOne(x => x.Order)
                .WithMany()
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.SetNull);

            im.HasIndex(x => new { x.TenantId, x.InventoryItemId, x.CreatedAt });
            im.HasQueryFilter(x => CurrentTenantId == null || x.TenantId == CurrentTenantId);
        });

        // -------------------------------------------------------------
        // 6. Clientes, Pedidos, Despacho y Desglose
        // -------------------------------------------------------------
        modelBuilder.Entity<Customer>(cust =>
        {
            cust.ToTable("Customers");
            cust.HasKey(x => x.Id);
            cust.Property(x => x.IdentificationType).HasMaxLength(50).IsRequired();
            cust.Property(x => x.IdentificationNumber).HasMaxLength(50).IsRequired();
            cust.Property(x => x.FullName).HasMaxLength(150).IsRequired();
            cust.Property(x => x.Phone).HasMaxLength(30).IsRequired();
            cust.Property(x => x.Email).HasMaxLength(150);
            cust.Property(x => x.DefaultAddressStreet).HasMaxLength(300);
            cust.Property(x => x.DefaultAddressReference).HasMaxLength(300);
            cust.Property(x => x.DefaultLocationPoint).HasColumnType("geometry(Point, 4326)");

            cust.HasIndex(x => new { x.TenantId, x.IdentificationNumber }).IsUnique();
            cust.HasIndex(x => new { x.TenantId, x.Phone });

            cust.HasOne(x => x.Tenant)
                .WithMany()
                .HasForeignKey(x => x.TenantId)
                .OnDelete(DeleteBehavior.Cascade);

            cust.HasQueryFilter(x => CurrentTenantId == null || x.TenantId == CurrentTenantId);
        });

        modelBuilder.Entity<Order>(o =>
        {
            o.ToTable("Orders");
            o.HasKey(x => x.Id);

            o.Property(x => x.CustomerName).HasMaxLength(150).IsRequired();
            o.Property(x => x.CustomerPhone).HasMaxLength(30).IsRequired();
            o.Property(x => x.CustomerEmail).HasMaxLength(150);

            o.Property(x => x.IdentificationType).HasMaxLength(50).IsRequired();
            o.Property(x => x.IdentificationNumber).HasMaxLength(50).IsRequired();

            o.Property(x => x.AddressStreet).HasMaxLength(300).IsRequired();
            o.Property(x => x.AddressReference).HasMaxLength(300);
            o.Property(x => x.CustomerNotes).HasMaxLength(500);
            o.Property(x => x.CancellationReason).HasMaxLength(300);

            o.Property(x => x.DeliveryLocation)
                .HasColumnType("geometry(Point, 4326)");

            o.Property(x => x.Subtotal).HasPrecision(18, 2);
            o.Property(x => x.DiscountAmount).HasPrecision(18, 2);
            o.Property(x => x.TaxAmount).HasPrecision(18, 2);
            o.Property(x => x.DeliveryFee).HasPrecision(18, 2);
            o.Property(x => x.Total).HasPrecision(18, 2);
            o.Property(x => x.CashAmountPaid).HasPrecision(18, 2);
            o.Property(x => x.ChangeDue).HasPrecision(18, 2);
            o.Property(x => x.TransferReceiptUrl).HasMaxLength(500);

            o.Property(x => x.Source).HasConversion<string>().HasMaxLength(50);
            o.Property(x => x.Status).HasConversion<string>().HasMaxLength(50);
            o.Property(x => x.PaymentMethod).HasConversion<string>().HasMaxLength(50);
            o.Property(x => x.DeliveryType).HasConversion<string>().HasMaxLength(50);

            o.HasIndex(x => new { x.TenantId, x.BranchId, x.Status, x.CreatedAt });

            o.HasOne(x => x.Tenant)
                .WithMany(x => x.Orders)
                .HasForeignKey(x => x.TenantId)
                .OnDelete(DeleteBehavior.Cascade);

            o.HasOne(x => x.Branch)
                .WithMany(x => x.Orders)
                .HasForeignKey(x => x.BranchId)
                .OnDelete(DeleteBehavior.Restrict);

            o.HasOne(x => x.Customer)
                .WithMany(x => x.Orders)
                .HasForeignKey(x => x.CustomerId)
                .OnDelete(DeleteBehavior.SetNull);

            o.HasOne(x => x.Shift)
                .WithMany(x => x.Orders)
                .HasForeignKey(x => x.ShiftId)
                .OnDelete(DeleteBehavior.SetNull);

            o.HasOne(x => x.DiningTable)
                .WithMany()
                .HasForeignKey(x => x.DiningTableId)
                .OnDelete(DeleteBehavior.SetNull);

            o.HasOne(x => x.CreatedByUser)
                .WithMany()
                .HasForeignKey(x => x.CreatedByUserId)
                .OnDelete(DeleteBehavior.SetNull);

            o.HasQueryFilter(x => CurrentTenantId == null || x.TenantId == CurrentTenantId);
        });

        modelBuilder.Entity<Invoice>(inv =>
        {
            inv.ToTable("Invoices");
            inv.HasKey(x => x.Id);
            inv.Property(x => x.SequentialNumber).HasMaxLength(30).IsRequired();
            inv.Property(x => x.SriAccessKey).HasMaxLength(49).IsRequired();
            inv.HasIndex(x => x.SriAccessKey).IsUnique();
            inv.Property(x => x.SriStatus).HasMaxLength(30).IsRequired();
            inv.Property(x => x.BuyerIdentificationType).HasMaxLength(50).IsRequired();
            inv.Property(x => x.BuyerIdentificationNumber).HasMaxLength(50).IsRequired();
            inv.Property(x => x.BuyerName).HasMaxLength(200).IsRequired();
            inv.Property(x => x.BuyerEmail).HasMaxLength(150);
            inv.Property(x => x.SubtotalZeroTax).HasPrecision(18, 2);
            inv.Property(x => x.SubtotalTaxable).HasPrecision(18, 2);
            inv.Property(x => x.TaxAmount).HasPrecision(18, 2);
            inv.Property(x => x.Total).HasPrecision(18, 2);
            inv.Property(x => x.SriErrorMessage).HasMaxLength(500);

            inv.HasOne(x => x.Order)
                .WithOne(x => x.Invoice)
                .HasForeignKey<Invoice>(x => x.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            inv.HasOne(x => x.Branch)
                .WithMany()
                .HasForeignKey(x => x.BranchId)
                .OnDelete(DeleteBehavior.Restrict);

            inv.HasQueryFilter(x => CurrentTenantId == null || x.TenantId == CurrentTenantId);
        });

        modelBuilder.Entity<OrderItem>(oi =>
        {
            oi.ToTable("OrderItems");
            oi.HasKey(x => x.Id);
            oi.Property(x => x.ProductNameSnapshot).HasMaxLength(150).IsRequired();
            oi.Property(x => x.UnitPriceSnapshot).HasPrecision(18, 2);
            oi.Property(x => x.TaxRateSnapshot).HasPrecision(5, 2);
            oi.Property(x => x.Notes).HasMaxLength(300);

            oi.HasOne(x => x.Order)
                .WithMany(x => x.Items)
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            oi.HasOne(x => x.Product)
                .WithMany()
                .HasForeignKey(x => x.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            oi.HasQueryFilter(x => CurrentTenantId == null || x.Order.TenantId == CurrentTenantId);
        });

        modelBuilder.Entity<OrderItemModifier>(oim =>
        {
            oim.ToTable("OrderItemModifiers");
            oim.HasKey(x => x.Id);
            oim.Property(x => x.ModifierNameSnapshot).HasMaxLength(150).IsRequired();
            oim.Property(x => x.PriceSnapshot).HasPrecision(18, 2);

            oim.HasOne(x => x.OrderItem)
                .WithMany(x => x.Modifiers)
                .HasForeignKey(x => x.OrderItemId)
                .OnDelete(DeleteBehavior.Cascade);

            oim.HasOne(x => x.ModifierOption)
                .WithMany()
                .HasForeignKey(x => x.ModifierOptionId)
                .OnDelete(DeleteBehavior.Restrict);

            oim.HasQueryFilter(x => CurrentTenantId == null || x.OrderItem.Order.TenantId == CurrentTenantId);
        });
    }
}
