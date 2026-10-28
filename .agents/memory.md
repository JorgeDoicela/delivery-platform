# Memoria Local del Proyecto — Delivery Platform

## 1. Arquitectura Backend: Vertical Slice Architecture (VSA) Estricta
* **Autonomía por Slice:** Cada funcionalidad en `backend/src/Delivery.Features/` encapsula su propio `*Endpoint.cs` (implementando `IEndpoint`), `*Handler.cs`, comandos/consultas, validadores FluentValidation y DTOs.
* **Prohibición de Controladores Horizontales:** Prohibido crear carpetas o archivos de endpoints agrupados en `Delivery.Api/Endpoints/`. `Delivery.Api/Program.cs` mapea automáticamente todos los slices mediante `app.MapEndpoints()`.
* **Inyección de Dependencias:** `AddDeliveryFeatures()` auto-registra por escaneo de ensamblado todos los handlers (`*Handler`), validadores y endpoints (`IEndpoint`). No requiere registros manuales en `DependencyInjection.cs`.
* **Framework Reference:** `Delivery.Features.csproj` contiene `<FrameworkReference Include="Microsoft.AspNetCore.App" />` para soporte nativo de Minimal APIs en cada slice.

