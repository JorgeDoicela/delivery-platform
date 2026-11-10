using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using Delivery.Core.Common;
using Delivery.Core.Contracts.Emails;
using Delivery.Core.Contracts.Emails.Models;
using Delivery.Core.Domain.Common;
using Delivery.Core.Domain.Entities;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Handlers;
using Delivery.Features.Common.Security;
using Microsoft.EntityFrameworkCore;
using RefreshTokenEntity = Delivery.Core.Domain.Entities.RefreshToken;

namespace Delivery.Features.Auth.Register;

public class RegisterHandler : IHandler<RegisterCommand, Result<RegisterResponse>>
{
    private readonly AppDbContext _context;
    private readonly ITenantContext _tenantContext;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenProvider _tokenProvider;
    private readonly IBackgroundEmailQueue? _emailQueue;

    public RegisterHandler(
        AppDbContext context,
        ITenantContext tenantContext,
        IPasswordHasher passwordHasher,
        ITokenProvider tokenProvider,
        IBackgroundEmailQueue? emailQueue = null)
    {
        _context = context;
        _tenantContext = tenantContext;
        _passwordHasher = passwordHasher;
        _tokenProvider = tokenProvider;
        _emailQueue = emailQueue;
    }

    public async Task<Result<RegisterResponse>> Handle(RegisterCommand request, CancellationToken cancellationToken = default)
    {
        // 1. Resolución segura del Tenant para asociar la cuenta
        Tenant? tenant = null;

        if (!string.IsNullOrWhiteSpace(request.TenantSlug))
        {
            var requestedSlug = request.TenantSlug.Trim().ToLowerInvariant();
            tenant = await _context.Tenants
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(t => t.Slug == requestedSlug, cancellationToken);
        }
        else if (_tenantContext.TenantId.HasValue)
        {
            tenant = await _context.Tenants
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(t => t.Id == _tenantContext.TenantId.Value, cancellationToken);
        }
        else
        {
            tenant = await _context.Tenants
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(t => t.Slug == "la-granjita", cancellationToken)
                ?? await _context.Tenants
                    .IgnoreQueryFilters()
                    .Where(t => t.IsActive)
                    .OrderBy(t => t.Id)
                    .FirstOrDefaultAsync(cancellationToken);
        }

        if (tenant == null)
        {
            return Result.Failure<RegisterResponse>(AuthErrors.TenantNotFound);
        }

        if (!tenant.IsActive)
        {
            return Result.Failure<RegisterResponse>(AuthErrors.TenantInactive);
        }

        // 2. Comprobación de unicidad de correo electrónico
        var emailLower = request.Email.Trim().ToLower(CultureInfo.InvariantCulture);

#pragma warning disable CA1862, CA1304, CA1311
        var emailExists = await _context.Users
            .IgnoreQueryFilters()
            .AnyAsync(u => (u.TenantId == tenant.Id || u.TenantId == null) && u.Email.ToLower() == emailLower, cancellationToken);
#pragma warning restore CA1862, CA1304, CA1311

        if (emailExists)
        {
            return Result.Failure<RegisterResponse>(AuthErrors.EmailAlreadyRegistered);
        }

        // 3. Creación de la cuenta de usuario con contraseña cifrada en BCrypt
        var passwordHash = _passwordHasher.Hash(request.Password);
        var resolvedFullName = !string.IsNullOrWhiteSpace(request.FullName)
            ? request.FullName.Trim()
            : emailLower.Split('@')[0];

        var resolvedPhone = !string.IsNullOrWhiteSpace(request.Phone)
            ? request.Phone.Trim()
            : string.Empty;

        var newUser = new User
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            Email = emailLower,
            FullName = resolvedFullName,
            Phone = resolvedPhone,
            PasswordHash = passwordHash,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Users.AddAsync(newUser, cancellationToken);

        // 4. Asignación del rol de Cliente (Customer)
        var customerRole = await _context.Roles
            .FirstOrDefaultAsync(r => r.Id == Role.Customer, cancellationToken);

        var userRole = new UserRole
        {
            Id = Guid.NewGuid(),
            UserId = newUser.Id,
            RoleId = Role.Customer
        };

        await _context.UserRoles.AddAsync(userRole, cancellationToken);

        // 5. Directorio de Clientes SRI para autocompletado en compras
        if (!string.IsNullOrWhiteSpace(newUser.Phone))
        {
            var customer = await _context.Customers
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(c => c.TenantId == tenant.Id && c.Phone == newUser.Phone, cancellationToken);

            if (customer == null)
            {
                customer = new Customer
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenant.Id,
                    FullName = newUser.FullName,
                    Phone = newUser.Phone,
                    Email = newUser.Email,
                    IdentificationType = request.IdentificationType ?? "CONSUMIDOR_FINAL",
                    IdentificationNumber = !string.IsNullOrWhiteSpace(request.IdentificationNumber)
                        ? request.IdentificationNumber.Trim()
                        : $"CF-{newUser.Id:N}"[..18],
                    CreatedAt = DateTime.UtcNow,
                    TotalOrdersCount = 0
                };
                await _context.Customers.AddAsync(customer, cancellationToken);
            }
        }

        // 6. Generación de tokens de sesión para autenticación inmediata
        var rolesList = new List<Role>();
        if (customerRole != null)
        {
            rolesList.Add(customerRole);
        }
        else
        {
            rolesList.Add(new Role { Id = Role.Customer, Name = "Customer", Description = "Cliente Comensal" });
        }

        var (accessToken, accessExpiresAt) = _tokenProvider.GenerateAccessToken(newUser, rolesList, tenant.Id, null);
        var (rawRefreshToken, tokenHash, refreshExpiresAt) = _tokenProvider.GenerateRefreshToken();

        // 7. Persistencia del Refresh Token
        var refreshTokenEntity = new RefreshTokenEntity
        {
            UserId = newUser.Id,
            TokenHash = tokenHash,
            ExpiresAt = refreshExpiresAt,
            CreatedAt = DateTime.UtcNow,
            CreatedByIp = request.IpAddress ?? string.Empty
        };

        await _context.RefreshTokens.AddAsync(refreshTokenEntity, cancellationToken);

        // 8. Generación del token de verificación de correo electrónico
        var rawVerificationBytes = RandomNumberGenerator.GetBytes(32);
        var rawVerificationToken = Convert.ToHexString(rawVerificationBytes).ToLowerInvariant();
        var verificationTokenHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawVerificationToken))).ToLowerInvariant();

        var verificationToken = new EmailVerificationToken
        {
            Id = Guid.NewGuid(),
            UserId = newUser.Id,
            TokenHash = verificationTokenHash,
            ExpiresAt = DateTime.UtcNow.AddHours(24),
            CreatedAt = DateTime.UtcNow,
            CreatedByIp = request.IpAddress ?? string.Empty
        };

        await _context.EmailVerificationTokens.AddAsync(verificationToken, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        // 9. Despacho asíncrono del correo de verificación vía SMTP
        if (_emailQueue != null)
        {
            var brand = new BrandEmailContext
            {
                BrandName = tenant.Name,
                BrandTagline = tenant.Tagline,
                PrimaryColor = tenant.BrandPrimaryColor ?? "#E4002B",
                LogoUrl = tenant.LogoUrl,
                SupportEmail = tenant.ContactEmail,
                SupportPhone = tenant.ContactPhone
            };

            var targetSlug = tenant.Slug;
            var verificationUrl = $"https://mesafy.doicela.dev/{targetSlug}/login?tab=verify-email&token={rawVerificationToken}&email={Uri.EscapeDataString(newUser.Email)}";

            var emailModel = new EmailVerificationEmailModel
            {
                Brand = brand,
                UserName = newUser.FullName,
                UserEmail = newUser.Email,
                VerificationUrl = verificationUrl,
                VerificationToken = rawVerificationToken,
                ExpirationMinutes = 1440
            };

            _emailQueue.EnqueueTemplatedEmail(
                newUser.Email,
                newUser.FullName,
                $"Verifica tu correo electrónico - {brand.BrandName}",
                EmailTemplateType.EmailVerification,
                emailModel,
                tenant.Id
            );
        }

        var userDto = new UserAuthInfoDto(
            newUser.Id,
            newUser.Email,
            newUser.FullName,
            newUser.Phone,
            "Customer",
            tenant.Id,
            tenant.Slug,
            null,
            true,
            new List<string> { "Customer" },
            newUser.IsEmailVerified,
            newUser.AvatarUrl);

        var response = new RegisterResponse(accessToken, rawRefreshToken, accessExpiresAt, userDto);
        return Result.Success(response);
    }
}
