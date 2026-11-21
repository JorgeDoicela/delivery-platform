namespace Delivery.Core.Domain.Policies;

/// <summary>
/// Reglas de dominio para resolver el modo operativo de Cocina (KDS) vs Mostrador
/// con herencia desde el Tenant y override opcional por sucursal.
/// </summary>
public static class KitchenWorkflowPolicy
{
    public static bool ResolveKitchenWorkflow(bool tenantDefault, bool? branchOverride)
        => branchOverride ?? tenantDefault;

    public static bool ResolveDirectCounterTakeoutDelivery(bool tenantDefault, bool? branchOverride)
        => branchOverride ?? tenantDefault;
}
