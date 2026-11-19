using Fido2NetLib;
using Delivery.Core.Domain.Entities;
using Microsoft.AspNetCore.Http;

namespace Delivery.Features.Common.Security;

public interface IWebAuthnRelyingPartyResolver
{
    Fido2Configuration ResolveConfiguration(Tenant? tenant = null, string? clientOrigin = null);
    string ResolveRpId(Tenant? tenant = null, string? clientOrigin = null);
    string ResolveRpName(Tenant? tenant = null);
}
