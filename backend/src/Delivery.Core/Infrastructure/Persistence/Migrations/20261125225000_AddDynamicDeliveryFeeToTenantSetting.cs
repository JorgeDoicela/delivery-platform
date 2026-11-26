using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Delivery.Core.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDynamicDeliveryFeeToTenantSetting : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "EnableDynamicDistanceFee",
                table: "TenantSettings",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<double>(
                name: "BaseDeliveryDistanceKm",
                table: "TenantSettings",
                type: "double precision",
                nullable: false,
                defaultValue: 2.0);

            migrationBuilder.AddColumn<decimal>(
                name: "ExtraDeliveryFeePerKm",
                table: "TenantSettings",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0.50m);

            migrationBuilder.AddColumn<decimal>(
                name: "MaxDeliveryFee",
                table: "TenantSettings",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "FreeDeliveryMinOrderAmount",
                table: "TenantSettings",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EnableDynamicDistanceFee",
                table: "TenantSettings");

            migrationBuilder.DropColumn(
                name: "BaseDeliveryDistanceKm",
                table: "TenantSettings");

            migrationBuilder.DropColumn(
                name: "ExtraDeliveryFeePerKm",
                table: "TenantSettings");

            migrationBuilder.DropColumn(
                name: "MaxDeliveryFee",
                table: "TenantSettings");

            migrationBuilder.DropColumn(
                name: "FreeDeliveryMinOrderAmount",
                table: "TenantSettings");
        }
    }
}
