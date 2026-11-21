using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Delivery.Core.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddKitchenWorkflowConfiguration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "EnableKitchenWorkflow",
                table: "TenantSettings",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "AllowDirectCounterTakeoutDelivery",
                table: "TenantSettings",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "EnableKitchenWorkflowOverride",
                table: "Branches",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "AllowDirectCounterTakeoutDeliveryOverride",
                table: "Branches",
                type: "boolean",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EnableKitchenWorkflow",
                table: "TenantSettings");

            migrationBuilder.DropColumn(
                name: "AllowDirectCounterTakeoutDelivery",
                table: "TenantSettings");

            migrationBuilder.DropColumn(
                name: "EnableKitchenWorkflowOverride",
                table: "Branches");

            migrationBuilder.DropColumn(
                name: "AllowDirectCounterTakeoutDeliveryOverride",
                table: "Branches");
        }
    }
}
