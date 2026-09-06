import ClienteStock from "./_components/ClienteStock";
import { LotesDisponibles } from "./_components/datos-stock";

export default function PaginaStock() {
  return <ClienteStock lotesIniciales={LotesDisponibles} />;
}
