using Delivery.Core.Common;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Handlers;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Features.Tenants.ToggleTenantStatus;

public sealed record ToggleTenantStatusRequest(bool IsActive);

public sealed record ToggleTenantStatusCommand(Guid TenantId, bool IsActive);

public sealed record ToggleTenantStatusResponse(
    Guid Id,
    string Slug,
    string Name,
    bool IsActive
);

public sealed class ToggleTenantStatusHandler : IHandler<ToggleTenantStatusCommand, Result<ToggleTenantStatusResponse>>
{
    private readonly AppDbContext _context;

    public ToggleTenantStatusHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Result<ToggleTenantStatusResponse>> Handle(ToggleTenantStatusCommand command, CancellationToken cancellationToken = default)
    {
        var tenant = await _context.Tenants
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Id == command.TenantId, cancellationToken);

        if (tenant == null)
        {
            return Result.Failure<ToggleTenantStatusResponse>(
                new Error("Tenant.NotFound", "No se encontró el negocio solicitado en la plataforma."));
        }

        tenant.IsActive = command.IsActive;
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success(new ToggleTenantStatusResponse(
            tenant.Id,
            tenant.Slug,
            tenant.Name,
            tenant.IsActive
        ));
    }
}
