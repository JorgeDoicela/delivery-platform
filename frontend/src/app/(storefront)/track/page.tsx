import { OrderSearchView } from "@/features/tracking";

export const metadata = {
  title: "Rastrear Pedido | La Granjita",
  description: "Ingresa el código identificador de tu pedido para consultar la ubicación del repartidor en vivo.",
};

export default function TrackOrderSearchPage() {
  return (
    <div className="space-y-6">
      <OrderSearchView />
    </div>
  );
}
