using Delivery.Core.Domain.Entities;

namespace Delivery.Features.Common.Security;

public interface ITokenProvider
{
    (string Token, DateTime ExpiresAt) GenerateAccessToken(User user, IEnumerable<Role> roles, Guid? tenantId, int? branchId);
    (string RawToken, string TokenHash, DateTime ExpiresAt) GenerateRefreshToken();
    string HashToken(string rawToken);
}

