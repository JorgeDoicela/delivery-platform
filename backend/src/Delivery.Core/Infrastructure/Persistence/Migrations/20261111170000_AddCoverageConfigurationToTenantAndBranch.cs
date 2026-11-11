using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Delivery.Core.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCoverageConfigurationToTenantAndBranch : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "DeliveryRadiusKm",
                table: "Branches",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsCoverageStrict",
                table: "Branches",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "RequireCoverageValidation",
                table: "TenantSettings",
                type: "boolean",
                nullable: false,
                defaultValue: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeliveryRadiusKm",
                table: "Branches");

            migrationBuilder.DropColumn(
                name: "IsCoverageStrict",
                table: "Branches");

            migrationBuilder.DropColumn(
                name: "RequireCoverageValidation",
                table: "TenantSettings");
        }
    }
}

