# ==========================================
# Multi-stage Dockerfile para Delivery.Api (.NET 8)
# ==========================================

# 1. Etapa de compilación
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copiar archivos de proyecto y configuración global para cachear la restauración de paquetes NuGet
COPY ["backend/Directory.Build.props", "backend/"]
COPY ["backend/src/Delivery.Core/Delivery.Core.csproj", "backend/src/Delivery.Core/"]
COPY ["backend/src/Delivery.Features/Delivery.Features.csproj", "backend/src/Delivery.Features/"]
COPY ["backend/src/Delivery.Api/Delivery.Api.csproj", "backend/src/Delivery.Api/"]

RUN dotnet restore "backend/src/Delivery.Api/Delivery.Api.csproj"

# Copiar todo el código fuente del backend
COPY backend/src/ backend/src/

WORKDIR "/src/backend/src/Delivery.Api"
RUN dotnet publish "Delivery.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# 2. Etapa de ejecución (Runtime optimizado)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:5005
ENV ASPNETCORE_ENVIRONMENT=Production
ENV DOTNET_RUNNING_IN_CONTAINER=true

EXPOSE 5005

COPY --from=build /app/publish .

# Usuario sin privilegios de root (estándar en .NET 8)
USER $APP_UID

HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:5005/health || exit 1

ENTRYPOINT ["dotnet", "Delivery.Api.dll"]
