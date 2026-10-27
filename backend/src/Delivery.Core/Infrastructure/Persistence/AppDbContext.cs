using Delivery.Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Core.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Branch> Branches => Set<Branch>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ModifierGroup> ModifierGroups => Set<ModifierGroup>();
    public DbSet<ProductModifierGroup> ProductModifierGroups => Set<ProductModifierGroup>();
    public DbSet<ModifierOption> ModifierOptions => Set<ModifierOption>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<OrderItemModifier> OrderItemModifiers => Set<OrderItemModifier>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Habilitar extensiones requeridas de PostgreSQL
        modelBuilder.HasPostgresExtension("postgis");
        modelBuilder.HasPostgresExtension("uuid-ossp");

        // Configuración de Branch (Sucursal y Geocercas)
        modelBuilder.Entity<Branch>(b =>
        {
            b.ToTable("Branches");
            b.HasKey(x => x.Id);
            b.Property(x => x.Name).HasMaxLength(150).IsRequired();
            b.Property(x => x.Address).HasMaxLength(300);
            b.Property(x => x.Phone).HasMaxLength(30);

            // Mapeo espacial explícito SRID 4326 (WGS84)
            b.Property(x => x.LocationPoint)
                .HasColumnType("geometry(Point, 4326)")
                .IsRequired();

            b.Property(x => x.CoveragePolygon)
                .HasColumnType("geometry(Polygon, 4326)")
                .IsRequired();

            // Índice GiST espacial obligatorio para ST_Contains en tiempo logarítmico O(log N)
            b.HasIndex(x => x.CoveragePolygon)
                .HasMethod("GIST")
                .HasDatabaseName("idx_branches_coverage_polygon");
        });

        // Configuración de Product
        modelBuilder.Entity<Product>(p =>
        {
            p.ToTable("Products");
            p.HasKey(x => x.Id);
            p.Property(x => x.Name).HasMaxLength(150).IsRequired();
            p.Property(x => x.Description).HasMaxLength(500);
            p.Property(x => x.BasePrice).HasPrecision(18, 2);
            p.Property(x => x.Category).HasMaxLength(100);
            p.Property(x => x.ImageUrl).HasMaxLength(500);
        });

        // Configuración de ModifierGroup
        modelBuilder.Entity<ModifierGroup>(mg =>
        {
            mg.ToTable("ModifierGroups");
            mg.HasKey(x => x.Id);
            mg.Property(x => x.Name).HasMaxLength(150).IsRequired();
        });

        // Configuración de ProductModifierGroup (Muchos a Muchos)
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
        });

        // Configuración de ModifierOption
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
        });

        // Configuración de Order
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

            o.Property(x => x.DeliveryLocation)
                .HasColumnType("geometry(Point, 4326)");

            o.Property(x => x.Subtotal).HasPrecision(18, 2);
            o.Property(x => x.DeliveryFee).HasPrecision(18, 2);
            o.Property(x => x.Total).HasPrecision(18, 2);
            o.Property(x => x.CashAmountPaid).HasPrecision(18, 2);
            o.Property(x => x.ChangeDue).HasPrecision(18, 2);

            o.Property(x => x.Status)
                .HasConversion<string>()
                .HasMaxLength(50);

            o.Property(x => x.PaymentMethod)
                .HasConversion<string>()
                .HasMaxLength(50);

            o.Property(x => x.DeliveryType)
                .HasConversion<string>()
                .HasMaxLength(50);

            o.HasOne(x => x.Branch)
                .WithMany(x => x.Orders)
                .HasForeignKey(x => x.BranchId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configuración de OrderItem
        modelBuilder.Entity<OrderItem>(oi =>
        {
            oi.ToTable("OrderItems");
            oi.HasKey(x => x.Id);

            oi.Property(x => x.ProductNameSnapshot).HasMaxLength(150).IsRequired();
            oi.Property(x => x.UnitPriceSnapshot).HasPrecision(18, 2);

            oi.HasOne(x => x.Order)
                .WithMany(x => x.Items)
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            oi.HasOne(x => x.Product)
                .WithMany()
                .HasForeignKey(x => x.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configuración de OrderItemModifier
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
        });
    }
}
