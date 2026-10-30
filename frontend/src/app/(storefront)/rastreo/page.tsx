import { OrderSearchView } from "@/features/tracking";

export const metadata = {
  title: "Rastrear Pedido en Vivo",
  description: "Ingresa el código identificador de tu pedido para consultar la ubicación del repartidor en vivo.",
};

export default function RastreoPage() {
  return (
    <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-8 lg:px-12 py-8">
      <OrderSearchView />
    </div>
  );
}

