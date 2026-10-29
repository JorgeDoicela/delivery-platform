using Delivery.Core.Common;
using Microsoft.AspNetCore.Http;

namespace Delivery.Features.Common.Http;

public static class ResultExtensions
{
    public static IResult ToHttpResult<T>(this Result<T> result, Func<T, IResult>? onSuccess = null, int? errorStatusCode = null)
    {
        if (result.IsSuccess)
        {
            return onSuccess != null ? onSuccess(result.Value) : Results.Ok(result.Value);
        }

        return CreateProblemResult(result.Error, errorStatusCode);
    }

    public static IResult ToHttpResult(this Result result, Func<IResult>? onSuccess = null, int? errorStatusCode = null)
    {
        if (result.IsSuccess)
        {
            return onSuccess != null ? onSuccess() : Results.Ok();
        }

        return CreateProblemResult(result.Error, errorStatusCode);
    }

    private static IResult CreateProblemResult(Error error, int? overrideStatusCode)
    {
        int statusCode = overrideStatusCode ?? DetermineStatusCode(error.Code);

        return Results.Problem(
            statusCode: statusCode,
            title: GetTitleForStatusCode(statusCode),
            detail: error.Message,
            extensions: new Dictionary<string, object?>
            {
                ["code"] = error.Code
            }
        );
    }

    private static int DetermineStatusCode(string errorCode) => errorCode switch
    {
        var code when code.Contains("Unauthorized", StringComparison.OrdinalIgnoreCase) ||
                       code.Contains("InvalidCredentials", StringComparison.OrdinalIgnoreCase) ||
                       code.Contains("InvalidRefreshToken", StringComparison.OrdinalIgnoreCase) => StatusCodes.Status401Unauthorized,
        var code when code.Contains("Forbidden", StringComparison.OrdinalIgnoreCase) ||
                       code.Contains("UserInactive", StringComparison.OrdinalIgnoreCase) ||
                       code.Contains("TenantInactive", StringComparison.OrdinalIgnoreCase) => StatusCodes.Status403Forbidden,
        var code when code.EndsWith("NotFound", StringComparison.OrdinalIgnoreCase) => StatusCodes.Status404NotFound,
        var code when code.Contains("OutsideCoverage", StringComparison.OrdinalIgnoreCase) => StatusCodes.Status422UnprocessableEntity,
        var code when code.Contains("SlotCapacityExceeded", StringComparison.OrdinalIgnoreCase) => StatusCodes.Status429TooManyRequests,
        var code when code.Contains("Conflict", StringComparison.OrdinalIgnoreCase) => StatusCodes.Status409Conflict,
        var code when code.Contains("NotPendingValidation", StringComparison.OrdinalIgnoreCase) => StatusCodes.Status400BadRequest,
        var code when code.Contains("InvalidTransition", StringComparison.OrdinalIgnoreCase) => StatusCodes.Status400BadRequest,
        _ => StatusCodes.Status400BadRequest
    };

    private static string GetTitleForStatusCode(int statusCode) => statusCode switch
    {
        StatusCodes.Status400BadRequest => "Bad Request",
        StatusCodes.Status401Unauthorized => "Unauthorized",
        StatusCodes.Status403Forbidden => "Forbidden",
        StatusCodes.Status404NotFound => "Not Found",
        StatusCodes.Status409Conflict => "Conflict",
        StatusCodes.Status422UnprocessableEntity => "Unprocessable Entity",
        StatusCodes.Status429TooManyRequests => "Too Many Requests",
        _ => "An error occurred processing the request"
    };
}

