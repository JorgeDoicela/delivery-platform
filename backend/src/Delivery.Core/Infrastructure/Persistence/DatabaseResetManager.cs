using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Delivery.Core.Infrastructure.Persistence;

/// <summary>
/// Gestiona el ciclo de vida de inicialización, migraciones y reinicio opcional de la base de datos
/// en función del switch de configuración RESET_DATABASE_ON_STARTUP.
/// </summary>
public static partial class DatabaseResetManager
{
    private const string PublicSchemaResetSql = @"
DO $reset$
DECLARE
    r RECORD;
BEGIN
    -- 1. Eliminar vistas de usuario en esquema public (excluyendo vistas de extensiones como PostGIS)
    FOR r IN (
        SELECT c.relname
        FROM pg_class c
        WHERE c.relnamespace = 'public'::regnamespace
          AND c.relkind = 'v'
          AND NOT EXISTS (
              SELECT 1 FROM pg_depend d
              WHERE d.objid = c.oid AND d.deptype = 'e'
          )
    ) LOOP
        EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(r.relname) || ' CASCADE;';
    END LOOP;

    -- 2. Eliminar tablas de usuario en esquema public (excluyendo tablas de extensiones como spatial_ref_sys)
    FOR r IN (
        SELECT c.relname
        FROM pg_class c
        WHERE c.relnamespace = 'public'::regnamespace
          AND c.relkind = 'r'
          AND NOT EXISTS (
              SELECT 1 FROM pg_depend d
              WHERE d.objid = c.oid AND d.deptype = 'e'
          )
    ) LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.relname) || ' CASCADE;';
    END LOOP;

    -- 3. Eliminar secuencias de usuario en esquema public (excluyendo secuencias de extensiones)
    FOR r IN (
        SELECT c.relname
        FROM pg_class c
        WHERE c.relnamespace = 'public'::regnamespace
          AND c.relkind = 'S'
          AND NOT EXISTS (
              SELECT 1 FROM pg_depend d
              WHERE d.objid = c.oid AND d.deptype = 'e'
          )
    ) LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS public.' || quote_ident(r.relname) || ' CASCADE;';
    END LOOP;
END $reset$;";

    /// <summary>
    /// Evalúa si el switch de reinicio de base de datos se encuentra activo.
    /// Prioriza variables de entorno sobre appsettings.json.
    /// </summary>
    public static bool IsResetOnStartupEnabled(IConfiguration? configuration)
    {
        // 1. Prioridad: Variables de entorno explícitas (útil para Docker y VPS)
        var envValue = Environment.GetEnvironmentVariable("RESET_DATABASE_ON_STARTUP")
            ?? Environment.GetEnvironmentVariable("DATABASE_RESET_ON_STARTUP")
            ?? Environment.GetEnvironmentVariable("DB_RESET_ON_STARTUP");

        if (!string.IsNullOrWhiteSpace(envValue))
        {
            return envValue.Equals("true", StringComparison.OrdinalIgnoreCase) ||
                   envValue.Equals("1", StringComparison.OrdinalIgnoreCase) ||
                   envValue.Equals("yes", StringComparison.OrdinalIgnoreCase);
        }

        // 2. Configuración inyectada (appsettings.json o argumentos de línea de comandos)
        if (configuration != null)
        {
            var configValue = configuration["Database:ResetOnStartup"]
                ?? configuration["RESET_DATABASE_ON_STARTUP"];

            if (!string.IsNullOrWhiteSpace(configValue))
            {
                return configValue.Equals("true", StringComparison.OrdinalIgnoreCase) ||
                       configValue.Equals("1", StringComparison.OrdinalIgnoreCase) ||
                       configValue.Equals("yes", StringComparison.OrdinalIgnoreCase);
            }
        }

        return false;
    }

    /// <summary>
    /// Inicializa la base de datos aplicando migraciones y sembrado, ejecutando purga previa si el switch está activo.
    /// </summary>
    public static async Task InitializeDatabaseAsync(
        AppDbContext context,
        IConfiguration configuration,
        ILogger logger,
        Func<Task>? onDatabasePurged = null,
        CancellationToken cancellationToken = default)
    {
        var shouldReset = IsResetOnStartupEnabled(configuration);

        if (shouldReset)
        {
            LogResetActive(logger);

            // Purgar esquema público en PostgreSQL manteniendo extensiones espaciales
            await context.Database.ExecuteSqlRawAsync(PublicSchemaResetSql, cancellationToken);
            LogPublicSchemaPurged(logger);

            // Ejecutar hook de limpieza adicional (ej. vaciar caché Redis)
            if (onDatabasePurged != null)
            {
                try
                {
                    await onDatabasePurged();
                    LogAdditionalServicesReset(logger);
                }
                catch (Exception ex)
                {
                    LogAdditionalServicesError(logger, ex);
                }
            }
        }
        else
        {
            LogResetInactive(logger);
        }

        // Aplicar migraciones pendientes
        LogApplyingMigrations(logger);
        await context.Database.MigrateAsync(cancellationToken);

        // Sembrar datos iniciales / de desarrollo
        LogExecutingSeeder(logger);
        await DatabaseSeeder.SeedAsync(context);

        LogDatabaseReady(logger);
    }

    [LoggerMessage(EventId = 1, Level = LogLevel.Warning, Message = "El switch RESET_DATABASE_ON_STARTUP está ACTIVO. Purgando tablas, secuencias y datos previos...")]
    private static partial void LogResetActive(ILogger logger);

    [LoggerMessage(EventId = 2, Level = LogLevel.Information, Message = "Esquema público purgado exitosamente.")]
    private static partial void LogPublicSchemaPurged(ILogger logger);

    [LoggerMessage(EventId = 3, Level = LogLevel.Information, Message = "Servicios complementarios reiniciados exitosamente.")]
    private static partial void LogAdditionalServicesReset(ILogger logger);

    [LoggerMessage(EventId = 4, Level = LogLevel.Warning, Message = "Error no bloqueante al ejecutar hook complementario de reinicio.")]
    private static partial void LogAdditionalServicesError(ILogger logger, Exception ex);

    [LoggerMessage(EventId = 5, Level = LogLevel.Information, Message = "Switch RESET_DATABASE_ON_STARTUP inactivo. Preservando datos existentes.")]
    private static partial void LogResetInactive(ILogger logger);

    [LoggerMessage(EventId = 6, Level = LogLevel.Information, Message = "Aplicando migraciones de Entity Framework Core...")]
    private static partial void LogApplyingMigrations(ILogger logger);

    [LoggerMessage(EventId = 7, Level = LogLevel.Information, Message = "Ejecutando sembrado de datos (DatabaseSeeder)...")]
    private static partial void LogExecutingSeeder(ILogger logger);

    [LoggerMessage(EventId = 8, Level = LogLevel.Information, Message = "Base de datos lista y operativa.")]
    private static partial void LogDatabaseReady(ILogger logger);
}
