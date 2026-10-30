using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Delivery.Core.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddLandingLayoutTemplateToTenantSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "LandingLayoutTemplate",
                table: "TenantSettings",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LandingLayoutTemplate",
                table: "TenantSettings");
        }
    }
}
