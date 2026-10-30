using Delivery.Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Core.Infrastructure.Persistence;

public partial class AppDbContext
{
    private void ConfigureCoreAndOperations(ModelBuilder modelBuilder)
    {
        // -------------------------------------------------------------
        // 1. Núcleo Multitenant
        // -------------------------------------------------------------
        modelBuilder.Entity<Tenant>(t =>
        {
            t.ToTable("Tenants");
            t.HasKey(x => x.Id);
            t.Property(x => x.Slug).HasMaxLength(50).IsRequired();
            t.HasIndex(x => x.Slug).IsUnique();
            t.Property(x => x.Name).HasMaxLength(150).IsRequired();
            t.Property(x => x.Tagline).HasMaxLength(100);
            t.Property(x => x.Description).HasMaxLength(500);
            t.Property(x => x.HeroSubtitle).HasMaxLength(250);
            t.Property(x => x.BusinessName).HasMaxLength(200);
            t.Property(x => x.TaxId).HasMaxLength(20);
            t.Property(x => x.LogoUrl).HasMaxLength(500);
            t.Property(x => x.BrandPrimaryColor).HasMaxLength(15);
            t.Property(x => x.BrandPrimaryHoverColor).HasMaxLength(15);
            t.Property(x => x.BrandAccentColor).HasMaxLength(15);
            t.Property(x => x.ContactPhone).HasMaxLength(30);
            t.Property(x => x.ContactEmail).HasMaxLength(150);
        });

        modelBuilder.Entity<TenantSetting>(ts =>
        {
            ts.ToTable("TenantSettings");
            ts.HasKey(x => x.Id);
            ts.Property(x => x.CustomDomain).HasMaxLength(150);
            ts.Property(x => x.CurrencyCode).HasMaxLength(3).IsRequired();
            ts.Property(x => x.SriEnvironment).HasMaxLength(20).IsRequired();
            ts.Property(x => x.SriCertificatePath).HasMaxLength(500);
            ts.Property(x => x.BaseDeliveryFee).HasPrecision(18, 2);
            ts.Property(x => x.BankName).HasMaxLength(120);
            ts.Property(x => x.BankAccountType).HasMaxLength(50);
            ts.Property(x => x.BankAccountNumber).HasMaxLength(50);
            ts.Property(x => x.BankAccountHolder).HasMaxLength(150);
            ts.Property(x => x.BankAccountTaxId).HasMaxLength(30);
            ts.Property(x => x.HeroSlidesJson).HasColumnType("text");
            ts.Property(x => x.PromotionalBannersJson).HasColumnType("text");

            ts.HasOne(x => x.Tenant)
                .WithOne(x => x.Settings)
                .HasForeignKey<TenantSetting>(x => x.TenantId)
                .OnDelete(DeleteBehavior.Cascade);

            ts.HasQueryFilter(x => CurrentTenantId == null || x.TenantId == CurrentTenantId);
        });

        // -------------------------------------------------------------
        // 2. Seguridad & RBAC
        // -------------------------------------------------------------
        modelBuilder.Entity<User>(u =>
        {
            u.ToTable("Users");
            u.HasKey(x => x.Id);
            u.Property(x => x.Email).HasMaxLength(200).IsRequired();
            u.Property(x => x.PasswordHash).HasMaxLength(255).IsRequired();
            u.Property(x => x.FullName).HasMaxLength(150).IsRequired();
            u.Property(x => x.Phone).HasMaxLength(30);

            u.HasIndex(x => new { x.TenantId, x.Email }).IsUnique();

            u.HasOne(x => x.Tenant)
                .WithMany(x => x.Users)
                .HasForeignKey(x => x.TenantId)
                .OnDelete(DeleteBehavior.Cascade);

            u.HasQueryFilter(x => CurrentTenantId == null || x.TenantId == null || x.TenantId == CurrentTenantId);
        });

        modelBuilder.Entity<Role>(r =>
        {
            r.ToTable("Roles");
            r.HasKey(x => x.Id);
            r.Property(x => x.Name).HasMaxLength(50).IsRequired();
            r.Property(x => x.Description).HasMaxLength(200);
        });

        modelBuilder.Entity<UserRole>(ur =>
        {
            ur.ToTable("UserRoles");
            ur.HasKey(x => x.Id);
            ur.HasIndex(x => new { x.UserId, x.RoleId, x.BranchId }).IsUnique();

            ur.HasOne(x => x.User)
                .WithMany(x => x.UserRoles)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            ur.HasOne(x => x.Role)
                .WithMany()
                .HasForeignKey(x => x.RoleId)
                .OnDelete(DeleteBehavior.Restrict);

            ur.HasOne(x => x.Branch)
                .WithMany()
                .HasForeignKey(x => x.BranchId)
                .OnDelete(DeleteBehavior.Cascade);

            ur.HasQueryFilter(x => CurrentTenantId == null || x.User.TenantId == null || x.User.TenantId == CurrentTenantId);
        });

        modelBuilder.Entity<RefreshToken>(rt =>
        {
            rt.ToTable("RefreshTokens");
            rt.HasKey(x => x.Id);
            rt.Property(x => x.TokenHash).HasMaxLength(255).IsRequired();
            rt.Property(x => x.CreatedByIp).HasMaxLength(45);

            rt.HasOne(x => x.User)
                .WithMany(x => x.RefreshTokens)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            rt.HasQueryFilter(x => CurrentTenantId == null || x.User.TenantId == null || x.User.TenantId == CurrentTenantId);
        });

        // -------------------------------------------------------------
        // 3. Sucursales, Salón y Geocercas PostGIS
        // -------------------------------------------------------------
        modelBuilder.Entity<Branch>(b =>
        {
            b.ToTable("Branches");
            b.HasKey(x => x.Id);
            b.Property(x => x.Name).HasMaxLength(150).IsRequired();
            b.Property(x => x.Address).HasMaxLength(300);
            b.Property(x => x.Phone).HasMaxLength(30);
            b.Property(x => x.SriEstablishmentCode).HasMaxLength(3).IsRequired();
            b.Property(x => x.SriEmissionPoint).HasMaxLength(3).IsRequired();
            b.Property(x => x.OpeningTime).HasMaxLength(10).IsRequired();
            b.Property(x => x.ClosingTime).HasMaxLength(10).IsRequired();

            b.Property(x => x.LocationPoint)
                .HasColumnType("geometry(Point, 4326)")
                .IsRequired();

            b.Property(x => x.CoveragePolygon)
                .HasColumnType("geometry(Polygon, 4326)")
                .IsRequired();

            b.HasIndex(x => x.CoveragePolygon)
                .HasMethod("GIST")
                .HasDatabaseName("idx_branches_coverage_polygon");

            b.HasOne(x => x.Tenant)
                .WithMany(x => x.Branches)
                .HasForeignKey(x => x.TenantId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasQueryFilter(x => CurrentTenantId == null || x.TenantId == CurrentTenantId);
        });

        modelBuilder.Entity<DiningTable>(dt =>
        {
            dt.ToTable("DiningTables");
            dt.HasKey(x => x.Id);
            dt.Property(x => x.Name).HasMaxLength(50).IsRequired();

            dt.HasOne(x => x.Branch)
                .WithMany()
                .HasForeignKey(x => x.BranchId)
                .OnDelete(DeleteBehavior.Cascade);

            dt.HasQueryFilter(x => CurrentTenantId == null || x.TenantId == CurrentTenantId);
        });

        // -------------------------------------------------------------
        // 4. Turnos de Caja y Gastos Menores
        // -------------------------------------------------------------
        modelBuilder.Entity<CashShift>(cs =>
        {
            cs.ToTable("CashShifts");
            cs.HasKey(x => x.Id);
            cs.Property(x => x.InitialCashAmount).HasPrecision(18, 2);
            cs.Property(x => x.CashSalesTotal).HasPrecision(18, 2);
            cs.Property(x => x.TransferSalesTotal).HasPrecision(18, 2);
            cs.Property(x => x.CashoutTotal).HasPrecision(18, 2);
            cs.Property(x => x.FinalCountedCash).HasPrecision(18, 2);
            cs.Property(x => x.Difference).HasPrecision(18, 2);

            cs.HasOne(x => x.Branch)
                .WithMany()
                .HasForeignKey(x => x.BranchId)
                .OnDelete(DeleteBehavior.Restrict);

            cs.HasOne(x => x.CashierUser)
                .WithMany()
                .HasForeignKey(x => x.CashierUserId)
                .OnDelete(DeleteBehavior.Restrict);

            cs.HasIndex(x => new { x.TenantId, x.BranchId, x.ClosedAt });
            cs.HasQueryFilter(x => CurrentTenantId == null || x.TenantId == CurrentTenantId);
        });

        modelBuilder.Entity<CashTransaction>(ct =>
        {
            ct.ToTable("CashTransactions");
            ct.HasKey(x => x.Id);
            ct.Property(x => x.Type).HasMaxLength(20).IsRequired();
            ct.Property(x => x.Amount).HasPrecision(18, 2);
            ct.Property(x => x.Reason).HasMaxLength(250).IsRequired();

            ct.HasOne(x => x.Shift)
                .WithMany(x => x.Transactions)
                .HasForeignKey(x => x.ShiftId)
                .OnDelete(DeleteBehavior.Cascade);

            ct.HasQueryFilter(x => CurrentTenantId == null || x.TenantId == CurrentTenantId);
        });

        // -------------------------------------------------------------
        // 4.1 Repartidores y Telemetría
        // -------------------------------------------------------------
        modelBuilder.Entity<Driver>(d =>
        {
            d.ToTable("Drivers");
            d.HasKey(x => x.Id);
            d.Property(x => x.VehicleType).HasMaxLength(50).IsRequired();
            d.Property(x => x.LicensePlate).HasMaxLength(20);

            d.Property(x => x.CurrentLocation)
                .HasColumnType("geometry(Point, 4326)");

            d.HasOne(x => x.User)
                .WithOne()
                .HasForeignKey<Driver>(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            d.HasQueryFilter(x => CurrentTenantId == null || x.TenantId == CurrentTenantId);
        });

        modelBuilder.Entity<OrderDelivery>(od =>
        {
            od.ToTable("OrderDeliveries");
            od.HasKey(x => x.Id);

            od.HasOne(x => x.Order)
                .WithOne()
                .HasForeignKey<OrderDelivery>(x => x.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            od.HasOne(x => x.Driver)
                .WithMany(x => x.Deliveries)
                .HasForeignKey(x => x.DriverId)
                .OnDelete(DeleteBehavior.Restrict);

            od.HasQueryFilter(x => CurrentTenantId == null || x.Order.TenantId == CurrentTenantId);
        });
    }
}
