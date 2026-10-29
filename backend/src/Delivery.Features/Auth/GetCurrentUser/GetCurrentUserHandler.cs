using Delivery.Core.Common;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Handlers;
using Delivery.Features.Common.Security;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Features.Auth.GetCurrentUser;

public class GetCurrentUserHandler : IHandler<GetCurrentUserQuery, Result<UserInfoDto>>
{
    private readonly AppDbContext _context;

    public GetCurrentUserHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Result<UserInfoDto>> Handle(GetCurrentUserQuery request, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.IgnoreQueryFilters()
            .Include(u => u.Tenant)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Branch)
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user == null)
        {
            return Result.Failure<UserInfoDto>(AuthErrors.UserNotFound);
        }

        if (!user.IsActive)
        {
            return Result.Failure<UserInfoDto>(AuthErrors.UserInactive);
        }

        var roles = user.UserRoles.Select(ur => ur.Role.Name).Distinct().ToList();
        var primaryUserRole = user.UserRoles.FirstOrDefault(ur => ur.BranchId.HasValue);

        var dto = new UserInfoDto(
            user.Id,
            user.Email,
            user.FullName,
            user.Phone,
            user.TenantId,
            user.Tenant?.Name,
            user.Tenant?.Slug,
            primaryUserRole?.BranchId,
            primaryUserRole?.Branch?.Name,
            roles);

        return Result.Success(dto);
    }
}
