# ==============================================================================
# Script Operativo de Validación y Carga del Corpus Gastronómico (Delivery Platform)
# Ubicación: scripts/db/seed-corpus.ps1
# Uso: .\scripts\db\seed-corpus.ps1 [-ValidateOnly]
# ==============================================================================

[CmdletBinding()]
param(
    [switch]$ValidateOnly = $false
)

$ErrorActionPreference = "Stop"

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path "$scriptRoot\..\..").Path
$corpusDir = Join-Path $repoRoot "backend\src\Delivery.Core\Infrastructure\Persistence\Corpus"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  VALIDADOR DE CORPUS GASTRONOMICO MULTI-TENANT           " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Directorio de Corpus: $corpusDir" -ForegroundColor Gray

if (-not (Test-Path $corpusDir)) {
    Write-Error "No se encontro el directorio de corpus en: $corpusDir"
    exit 1
}

$corpusFiles = Get-ChildItem -Path $corpusDir -Filter "catalog.*.json"

if ($corpusFiles.Count -eq 0) {
    Write-Error "No se encontraron archivos de catalogo JSON en $corpusDir"
    exit 1
}

Write-Host "Catalogos encontrados: $($corpusFiles.Count)" -ForegroundColor Green

$hasErrors = $false

foreach ($file in $corpusFiles) {
    Write-Host "`nValidando: $($file.Name)..." -ForegroundColor Yellow
    try {
        $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
        $json = $content | ConvertFrom-Json

        if (-not $json.tenantSlug) {
            Write-Host "  [ERROR] Falta propiedad 'tenantSlug'" -ForegroundColor Red
            $hasErrors = $true
            continue
        }

        $catCount = if ($json.categories) { $json.categories.Count } else { 0 }
        $modCount = if ($json.modifierGroups) { $json.modifierGroups.Count } else { 0 }
        $prodCount = if ($json.products) { $json.products.Count } else { 0 }

        Write-Host "  Tenant Slug   : $($json.tenantSlug)" -ForegroundColor White
        Write-Host "  Categorias    : $catCount" -ForegroundColor White
        Write-Host "  Modificadores : $modCount" -ForegroundColor White
        Write-Host "  Platos/Items  : $prodCount" -ForegroundColor White

        # Validar consistencia interna de productos
        foreach ($p in $json.products) {
            if (-not $p.sku -or -not $p.name -or $p.basePrice -lt 0) {
                Write-Host "    [ERROR] Producto con datos invalidos: SKU='$($p.sku)', Nombre='$($p.name)'" -ForegroundColor Red
                $hasErrors = $true
            }
        }

        Write-Host "  [OK] Esquema y estructura validos." -ForegroundColor Green
    }
    catch {
        Write-Host "  [ERROR] Fallo al parsear JSON: $_" -ForegroundColor Red
        $hasErrors = $true
    }
}

if ($hasErrors) {
    Write-Host "`nSe encontraron errores en el corpus. Corrige los archivos antes de continuar." -ForegroundColor Red
    exit 1
}

Write-Host "`nTodos los archivos de corpus gastronomico son 100% validos." -ForegroundColor Green

if (-not $ValidateOnly) {
    Write-Host "`nEjecutando suite de pruebas unitarias de persistencia y seeding..." -ForegroundColor Cyan
    $testProject = Join-Path $repoRoot "backend\tests\Delivery.UnitTests\Delivery.UnitTests.csproj"
    dotnet test $testProject --filter "FullyQualifiedName~CorpusCatalogSeedingTests" -v q -nologo
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Seeding e idempotencia verificados exitosamente." -ForegroundColor Green
    } else {
        Write-Error "Fallo la prueba de seeding de corpus."
        exit $LASTEXITCODE
    }
}
