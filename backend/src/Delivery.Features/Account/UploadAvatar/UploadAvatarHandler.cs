using Delivery.Core.Common;
using Delivery.Core.Contracts.Storage;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Account;
using Delivery.Features.Common.Handlers;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Delivery.Features.Account.UploadAvatar;

public sealed record UploadAvatarCommand(Guid UserId, IFormFile File);

public sealed record UploadAvatarResponse(string AvatarUrl);

public sealed partial class UploadAvatarHandler : IHandler<UploadAvatarCommand, Result<UploadAvatarResponse>>
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp", ".heic", ".avif", ".bmp"
    };

    private const long MaxFileSizeBytes = 5 * 1024 * 1024; // 5 MB

    private readonly AppDbContext _context;
    private readonly IAvatarStorage _storageService;
    private readonly ILogger<UploadAvatarHandler> _logger;

    public UploadAvatarHandler(
        AppDbContext context,
        IAvatarStorage storageService,
        ILogger<UploadAvatarHandler> logger)
    {
        _context = context;
        _storageService = storageService;
        _logger = logger;
    }

    public async Task<Result<UploadAvatarResponse>> Handle(UploadAvatarCommand request, CancellationToken cancellationToken = default)
    {
        if (request.File is null || request.File.Length == 0)
        {
            return Result.Failure<UploadAvatarResponse>(new Error(
                "Avatar.EmptyFile",
                "Debes seleccionar un archivo de imagen válido."));
        }

        if (request.File.Length > MaxFileSizeBytes)
        {
            return Result.Failure<UploadAvatarResponse>(new Error(
                "Avatar.FileTooLarge",
                "El tamaño de la imagen no puede superar los 5 MB."));
        }

        var extension = Path.GetExtension(request.File.FileName);
        if (string.IsNullOrWhiteSpace(extension) || !AllowedExtensions.Contains(extension))
        {
            return Result.Failure<UploadAvatarResponse>(new Error(
                "Avatar.InvalidFormat",
                "Formato de imagen no permitido. Selecciona un archivo en formato JPG, PNG o WebP."));
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId && u.IsActive, cancellationToken);

        if (user is null)
        {
            return Result.Failure<UploadAvatarResponse>(AccountErrors.UserNotFound);
        }

        try
        {
            await using var stream = request.File.OpenReadStream();
            var avatarUrl = await _storageService.SaveAvatarAsync(
                stream,
                request.File.FileName,
                user.Id,
                user.TenantId,
                cancellationToken);

            user.AvatarUrl = avatarUrl;
            await _context.SaveChangesAsync(cancellationToken);

            return Result.Success(new UploadAvatarResponse(avatarUrl));
        }
        catch (InvalidOperationException ex)
        {
            LogImageValidationFailed(_logger, ex, request.UserId);
            return Result.Failure<UploadAvatarResponse>(new Error(
                "Avatar.ProcessingError",
                ex.Message));
        }
        catch (Exception ex)
        {
            LogAvatarProcessingError(_logger, ex, request.UserId);
            return Result.Failure<UploadAvatarResponse>(new Error(
                "Avatar.UnexpectedError",
                "Ocurrió un error inesperado al procesar y convertir tu foto de perfil."));
        }
    }

    [LoggerMessage(EventId = 1, Level = LogLevel.Warning, Message = "Fallo de validación de imagen para el usuario {UserId}")]
    private static partial void LogImageValidationFailed(ILogger logger, Exception ex, Guid userId);

    [LoggerMessage(EventId = 2, Level = LogLevel.Error, Message = "Error inesperado procesando avatar para el usuario {UserId}")]
    private static partial void LogAvatarProcessingError(ILogger logger, Exception ex, Guid userId);
}

