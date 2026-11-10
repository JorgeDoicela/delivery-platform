using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Delivery.Core.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomerConsentAndWhatsAppSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CustomPrivacyPolicyUrl",
                table: "TenantSettings",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "EnableWhatsAppBot",
                table: "TenantSettings",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "RequireDataProtectionConsent",
                table: "TenantSettings",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.CreateTable(
                name: "CustomerConsents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    PhoneNumber = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Channel = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    ConsentVersion = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    AcceptedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EvidencePayload = table.Column<string>(type: "text", nullable: true),
                    IsRevoked = table.Column<bool>(type: "boolean", nullable: false),
                    RevokedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomerConsents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CustomerConsents_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CustomerConsents_TenantId_PhoneNumber",
                table: "CustomerConsents",
                columns: new[] { "TenantId", "PhoneNumber" });

            migrationBuilder.CreateIndex(
                name: "IX_CustomerConsents_TenantId_PhoneNumber_IsRevoked",
                table: "CustomerConsents",
                columns: new[] { "TenantId", "PhoneNumber", "IsRevoked" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CustomerConsents");

            migrationBuilder.DropColumn(
                name: "CustomPrivacyPolicyUrl",
                table: "TenantSettings");

            migrationBuilder.DropColumn(
                name: "EnableWhatsAppBot",
                table: "TenantSettings");

            migrationBuilder.DropColumn(
                name: "RequireDataProtectionConsent",
                table: "TenantSettings");
        }
    }
}
