'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, AlertCircle, PackageCheck, ChefHat, BarChart3 } from 'lucide-react';
import { useDriverStore } from '../store/useDriverStore';
import { useDriverHub } from '../hooks/useDriverHub';
import { DriverHeader } from './DriverHeader';
import { ActiveDeliveryTab } from './ActiveDeliveryTab';
import { AvailableOrdersTab } from './AvailableOrdersTab';
import { ShiftSummaryTab } from './ShiftSummaryTab';

interface DriverDeliveryViewProps {
  initialOrderId?: string;
}

export function DriverDeliveryView({ initialOrderId }: DriverDeliveryViewProps) {
  const {
    profile,
    activeOrders,
    availableOrders,
    deliveredToday,
    shiftSummary,
    selectedOrderId,
    activeTab,
    loading,
    error,
    fetchDashboard,
    toggleAvailability,
    claimOrder,
    completeDelivery,
    setSelectedOrderId,
    setActiveTab,
  } = useDriverStore();

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Carga inicial del panel operativo
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Si se pasa un initialOrderId explícito (ej: desde ruta de tracking o notificación directa)
  useEffect(() => {
    if (initialOrderId) {
      setSelectedOrderId(initialOrderId);
      setActiveTab('active');
    }
  }, [initialOrderId, setSelectedOrderId, setActiveTab]);

  // Suscripción en tiempo real a SignalR (Cocina y Despacho)
  useDriverHub({ branchId: profile?.branchId, enabled: Boolean(profile) });

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchDashboard();
    } finally {
      setIsRefreshing(false);
    }
  };

  const activeCount = activeOrders.length;
  const availableCount = availableOrders.length;

  return (
    <div className="space-y-4 w-full max-w-4xl mx-auto pb-10">
      {/* Cabecera del Repartidor */}
      <DriverHeader
        profile={profile}
        shiftSummary={shiftSummary}
        onToggleAvailability={toggleAvailability}
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Barra de Navegación por Pestañas Táctiles */}
      <div className="bg-surface-card border border-surface-border rounded-full p-1.5 flex items-center justify-between gap-1 shadow-xs text-xs font-bold uppercase tracking-wider">
        <button
          type="button"
          onClick={() => setActiveTab('active')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 px-3 sm:px-4 rounded-full transition-all cursor-pointer ${
            activeTab === 'active'
              ? 'bg-brand-primary text-white shadow-xs'
              : 'text-text-muted hover:text-text-strong'
          }`}
        >
          <PackageCheck className="w-4 h-4 shrink-0" />
          <span className="truncate">En Curso</span>
          {activeCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'active' ? 'bg-white text-brand-primary' : 'bg-brand-primary text-white'
              }`}
            >
              {activeCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('available')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 px-3 sm:px-4 rounded-full transition-all cursor-pointer ${
            activeTab === 'available'
              ? 'bg-brand-primary text-white shadow-xs'
              : 'text-text-muted hover:text-text-strong'
          }`}
        >
          <ChefHat className="w-4 h-4 shrink-0" />
          <span className="truncate">Cocina</span>
          {availableCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'available' ? 'bg-white text-brand-primary' : 'bg-status-warning text-white'
              }`}
            >
              {availableCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('shift')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 px-3 sm:px-4 rounded-full transition-all cursor-pointer ${
            activeTab === 'shift'
              ? 'bg-brand-primary text-white shadow-xs'
              : 'text-text-muted hover:text-text-strong'
          }`}
        >
          <BarChart3 className="w-4 h-4 shrink-0" />
          <span className="truncate">Turno</span>
        </button>
      </div>

      {/* Manejo de Error de Conexión */}
      {error && (
        <div className="bg-status-danger/15 border border-status-danger/30 text-status-danger rounded-2xl p-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchDashboard}
            className="underline font-bold uppercase tracking-wider text-[11px] cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Contenido Principal con Estado de Carga */}
      {loading && !profile ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-muted space-y-3">
          <RefreshCw className="h-8 w-8 animate-spin text-brand-primary" />
          <p className="text-xs">Sincronizando hoja de ruta del repartidor...</p>
        </div>
      ) : (
        <div>
          {activeTab === 'active' && (
            <ActiveDeliveryTab
              activeOrders={activeOrders}
              selectedOrderId={selectedOrderId}
              onSelectOrder={setSelectedOrderId}
              onCompleteDelivery={completeDelivery}
              onGoToAvailable={() => setActiveTab('available')}
              driverId={profile?.driverId}
            />
          )}

          {activeTab === 'available' && (
            <AvailableOrdersTab
              availableOrders={availableOrders}
              onClaimOrder={claimOrder}
            />
          )}

          {activeTab === 'shift' && (
            <ShiftSummaryTab
              profile={profile}
              shiftSummary={shiftSummary}
              deliveredToday={deliveredToday}
            />
          )}
        </div>
      )}
    </div>
  );
}
