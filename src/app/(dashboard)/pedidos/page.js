import ClientePedidos from "./_components/ClientePedidos";
import {
  Clientes,
  LotesIniciales,
  PedidosIniciales,
  Productos,
} from "./_components/datos-pedidos";

export default function PaginaPedidos() {
  return (
    <ClientePedidos
      clientes={Clientes}
      productos={Productos}
      lotesIniciales={LotesIniciales}
      pedidosIniciales={PedidosIniciales}
    />
  );
}
