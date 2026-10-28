import { OrderSearchView } from "@/features/tracking";

export const metadata = {
  title: "Rastrear Pedido | Delivery Platform",
  description: "Ingresa el código identificador de tu pedido para consultar la ubicación del repartidor en vivo.",
};

export default function TrackOrderSearchPage() {
  return <OrderSearchView />;
}
