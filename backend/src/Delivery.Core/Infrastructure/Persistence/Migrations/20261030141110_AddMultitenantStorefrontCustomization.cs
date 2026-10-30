using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Delivery.Core.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMultitenantStorefrontCustomization : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AcceptsBankTransfer",
                table: "TenantSettings",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "AcceptsCard",
                table: "TenantSettings",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "AcceptsCash",
                table: "TenantSettings",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "BankAccountHolder",
                table: "TenantSettings",
                type: "character varying(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BankAccountNumber",
                table: "TenantSettings",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BankAccountTaxId",
                table: "TenantSettings",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BankAccountType",
                table: "TenantSettings",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BankName",
                table: "TenantSettings",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "BaseDeliveryFee",
                table: "TenantSettings",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "EnableDelivery",
                table: "TenantSettings",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "EnableDineIn",
                table: "TenantSettings",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "EnableTakeout",
                table: "TenantSettings",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "HeroSlidesJson",
                table: "TenantSettings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PromotionalBannersJson",
                table: "TenantSettings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "QuickLinksEnabled",
                table: "TenantSettings",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AlterColumn<string>(
                name: "BrandPrimaryColor",
                table: "Tenants",
                type: "character varying(15)",
                maxLength: 15,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(10)",
                oldMaxLength: 10,
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BrandAccentColor",
                table: "Tenants",
                type: "character varying(15)",
                maxLength: 15,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BrandPrimaryHoverColor",
                table: "Tenants",
                type: "character varying(15)",
                maxLength: 15,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContactEmail",
                table: "Tenants",
                type: "character varying(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContactPhone",
                table: "Tenants",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Tenants",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "HeroSubtitle",
                table: "Tenants",
                type: "character varying(250)",
                maxLength: 250,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Tagline",
                table: "Tenants",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "RefreshTokens",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AcceptsBankTransfer",
                table: "TenantSettings");

            migrationBuilder.DropColumn(
                name: "AcceptsCard",
                table: "TenantSettings");

            migrationBuilder.DropColumn(
                name: "AcceptsCash",
                table: "TenantSettings");

            migrationBuilder.DropColumn(
                name: "BankAccountHolder",
                table: "TenantSettings");

            migrationBuilder.DropColumn(
                name: "BankAccountNumber",
                table: "TenantSettings");

            migrationBuilder.DropColumn(
                name: "BankAccountTaxId",
                table: "TenantSettings");

            migrationBuilder.DropColumn(
                name: "BankAccountType",
                table: "TenantSettings");

            migrationBuilder.DropColumn(
                name: "BankName",
                table: "TenantSettings");

            migrationBuilder.DropColumn(
                name: "BaseDeliveryFee",
                table: "TenantSettings");

            migrationBuilder.DropColumn(
                name: "EnableDelivery",
                table: "TenantSettings");

            migrationBuilder.DropColumn(
                name: "EnableDineIn",
                table: "TenantSettings");

            migrationBuilder.DropColumn(
                name: "EnableTakeout",
                table: "TenantSettings");

            migrationBuilder.DropColumn(
                name: "HeroSlidesJson",
                table: "TenantSettings");

            migrationBuilder.DropColumn(
                name: "PromotionalBannersJson",
                table: "TenantSettings");

            migrationBuilder.DropColumn(
                name: "QuickLinksEnabled",
                table: "TenantSettings");

            migrationBuilder.DropColumn(
                name: "BrandAccentColor",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "BrandPrimaryHoverColor",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "ContactEmail",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "ContactPhone",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "HeroSubtitle",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "Tagline",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "RefreshTokens");

            migrationBuilder.AlterColumn<string>(
                name: "BrandPrimaryColor",
                table: "Tenants",
                type: "character varying(10)",
                maxLength: 10,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(15)",
                oldMaxLength: 15,
                oldNullable: true);
        }
    }
}
