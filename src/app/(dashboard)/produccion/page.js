import ClienteProduccion from "./_components/ModProduccion";
import { Lotes_iniciales, Productos } from "./_components/datos-produccion";

export default function PaginaProduccion() {
  return (
    <ClienteProduccion lotesIniciales={Lotes_iniciales} productos={Productos} />
  );
}
