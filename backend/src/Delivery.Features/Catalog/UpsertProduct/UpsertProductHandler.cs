using Delivery.Core.Common;
using Delivery.Core.Domain.Common;
using Delivery.Core.Domain.Entities;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Handlers;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Features.Catalog.UpsertProduct;

public sealed record UpsertProductCommand(
    int? ProductId,
    string Name,
    string Description,
    decimal BasePrice,
    string Category,
    string ImageUrl,
    bool IsActive = true
);

public sealed record UpsertProductResponse(
    int Id,
    string Name,
    string Description,
    decimal BasePrice,
    string Category,
    string ImageUrl,
    bool IsActive
);

public sealed class UpsertProductValidator : AbstractValidator<UpsertProductCommand>
{
    public UpsertProductValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("El nombre del producto es obligatorio.")
            .MaximumLength(150);

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("La descripción del producto es obligatoria.")
            .MaximumLength(500);

        RuleFor(x => x.Category)
            .NotEmpty().WithMessage("La categoría del producto es obligatoria.")
            .MaximumLength(100);

        RuleFor(x => x.BasePrice)
            .GreaterThan(0m).WithMessage("El precio base debe ser mayor a 0.");

        RuleFor(x => x.ImageUrl)
            .NotEmpty().WithMessage("La URL o ruta de imagen del producto es obligatoria.")
            .MaximumLength(500);
    }
}

public sealed class UpsertProductHandler : IHandler<UpsertProductCommand, Result<UpsertProductResponse>>
{
    private readonly AppDbContext _context;
    private readonly ITenantContext _tenantContext;
    private readonly IValidator<UpsertProductCommand> _validator;

    public UpsertProductHandler(
        AppDbContext context,
        ITenantContext tenantContext,
        IValidator<UpsertProductCommand> validator)
    {
        _context = context;
        _tenantContext = tenantContext;
        _validator = validator;
    }

    public async Task<Result<UpsertProductResponse>> Handle(
        UpsertProductCommand command,
        CancellationToken cancellationToken = default)
    {
        var validation = await _validator.ValidateAsync(command, cancellationToken);
        if (!validation.IsValid)
        {
            var err = validation.Errors[0];
            return Result.Failure<UpsertProductResponse>(new Error("Catalog.Validation", err.ErrorMessage));
        }

        var categoryName = command.Category.Trim();
        var imageUrl = string.IsNullOrWhiteSpace(command.ImageUrl)
            ? "/images/shared/placeholders/dish-default.webp"
            : command.ImageUrl.Trim();

        if (command.ProductId.HasValue && command.ProductId.Value > 0)
        {
            var existingProduct = await _context.Products
                .FirstOrDefaultAsync(p => p.Id == command.ProductId.Value, cancellationToken);

            if (existingProduct is null)
            {
                return Result.Failure<UpsertProductResponse>(
                    new Error("Catalog.ProductNotFound", "El producto solicitado no existe en el catálogo del comercio actual."));
            }

            var categoryEntity = await EnsureCategoryAsync(existingProduct.TenantId, categoryName, cancellationToken);

            existingProduct.Name = command.Name.Trim();
            existingProduct.Description = command.Description.Trim();
            existingProduct.BasePrice = command.BasePrice;
            existingProduct.Category = categoryName;
            existingProduct.CategoryId = categoryEntity.Id;
            existingProduct.ImageUrl = imageUrl;
            existingProduct.IsActive = command.IsActive;

            await _context.SaveChangesAsync(cancellationToken);

            return Result.Success(new UpsertProductResponse(
                existingProduct.Id,
                existingProduct.Name,
                existingProduct.Description,
                existingProduct.BasePrice,
                existingProduct.Category,
                existingProduct.ImageUrl,
                existingProduct.IsActive
            ));
        }

        Guid tenantId;
        string tenantSlug;

        if (_tenantContext.TenantId.HasValue)
        {
            tenantId = _tenantContext.TenantId.Value;
            tenantSlug = _tenantContext.TenantSlug ?? "TENANT";
        }
        else
        {
            var fallbackTenant = await _context.Tenants
                .IgnoreQueryFilters()
                .AsNoTracking()
                .OrderBy(t => t.CreatedAt)
                .FirstOrDefaultAsync(t => t.IsActive, cancellationToken);

            if (fallbackTenant is null)
            {
                return Result.Failure<UpsertProductResponse>(
                    new Error("Tenant.NotResolved", "No se pudo resolver el comercio activo para registrar el producto."));
            }

            tenantId = fallbackTenant.Id;
            tenantSlug = fallbackTenant.Slug;
        }

        var category = await EnsureCategoryAsync(tenantId, categoryName, cancellationToken);
        var skuPrefix = tenantSlug.ToUpperInvariant();
        var uniqueSuffix = Guid.NewGuid().ToString("N")[..6].ToUpperInvariant();

        var newProduct = new Product
        {
            TenantId = tenantId,
            CategoryId = category.Id,
            Sku = $"{skuPrefix}-{uniqueSuffix}",
            Name = command.Name.Trim(),
            Description = command.Description.Trim(),
            BasePrice = command.BasePrice,
            TaxRate = 15.00m,
            ImageUrl = imageUrl,
            Category = categoryName,
            IsKitchen = true,
            IsActive = command.IsActive
        };

        await _context.Products.AddAsync(newProduct, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        var branches = await _context.Branches
            .AsNoTracking()
            .Where(b => b.TenantId == tenantId && b.IsActive)
            .ToListAsync(cancellationToken);

        foreach (var branch in branches)
        {
            await _context.BranchProducts.AddAsync(new BranchProduct
            {
                TenantId = tenantId,
                BranchId = branch.Id,
                ProductId = newProduct.Id,
                IsAvailable = true
            }, cancellationToken);
        }

        var defaultModifierGroup = await _context.ModifierGroups
            .AsNoTracking()
            .Where(mg => mg.TenantId == tenantId)
            .OrderBy(mg => mg.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (defaultModifierGroup is not null)
        {
            await _context.ProductModifierGroups.AddAsync(new ProductModifierGroup
            {
                ProductId = newProduct.Id,
                ModifierGroupId = defaultModifierGroup.Id
            }, cancellationToken);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success(new UpsertProductResponse(
            newProduct.Id,
            newProduct.Name,
            newProduct.Description,
            newProduct.BasePrice,
            newProduct.Category,
            newProduct.ImageUrl,
            newProduct.IsActive
        ));
    }

    private async Task<Category> EnsureCategoryAsync(
        Guid tenantId,
        string categoryName,
        CancellationToken cancellationToken)
    {
#pragma warning disable CA1862, CA1304, CA1311
        var existing = await _context.Categories
            .FirstOrDefaultAsync(
                c => c.TenantId == tenantId && c.Name.ToLower() == categoryName.ToLower(),
                cancellationToken);
#pragma warning restore CA1862, CA1304, CA1311

        if (existing is not null)
        {
            return existing;
        }

        var count = await _context.Categories
            .CountAsync(c => c.TenantId == tenantId, cancellationToken);

        var created = new Category
        {
            TenantId = tenantId,
            Name = categoryName,
            DisplayOrder = count + 1,
            IsActive = true
        };

        await _context.Categories.AddAsync(created, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return created;
    }
}

