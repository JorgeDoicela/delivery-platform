using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Delivery.Core.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddBankAccountsJsonToTenantSetting : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BankAccountsJson",
                table: "TenantSettings",
                type: "text",
                nullable: false,
                defaultValue: "[]");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BankAccountsJson",
                table: "TenantSettings");
        }
    }
}
