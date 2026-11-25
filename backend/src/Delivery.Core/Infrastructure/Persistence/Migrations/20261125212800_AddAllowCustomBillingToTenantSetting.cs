using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Delivery.Core.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAllowCustomBillingToTenantSetting : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AllowCustomBilling",
                table: "TenantSettings",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AllowCustomBilling",
                table: "TenantSettings");
        }
    }
}
