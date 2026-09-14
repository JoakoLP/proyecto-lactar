"use client";

import { useState } from "react";
import FormularioPedido from "./FormularioPedido";
import TablaPedidos from "./TablaPedidos";

const ESTADOS_EDITABLES = ["Pendiente", "En preparación", "Preparado"];
function obtenerKilosTotales(detalles) {
  return detalles.reduce((total, detalle) => total + detalle.kilos, 0);
}

function obtenerTotal(detalles) {
  return detalles.reduce(
    (total, detalle) => total + detalle.kilos * detalle.precioKg,
    0,
  );
}

function obtenerStock(lotes, producto) {
  return lotes
    .filter((lote) => lote.producto === producto)
    .reduce(
      (total, lote) => total + lote.kilosDisponibles - lote.kilosReservados,
      0,
    );
}

function ajustarReserva(lotes, pedidos, multiplicador = 1) {
  const resultado = lotes.map((lote) => ({ ...lote }));
  pedidos
    .flatMap((pedido) => pedido.detalles)
    .forEach((detalle) => {
      let pendiente = detalle.kilos;
      resultado.forEach((lote) => {
        if (lote.producto !== detalle.producto || pendiente <= 0) return;
        const capacidad = lote.kilosDisponibles - lote.kilosReservados;
        const ajuste = Math.min(capacidad, pendiente);
        lote.kilosReservados += ajuste * multiplicador;
        pendiente -= ajuste;
      });
    });
  return resultado;
}

export default function ClientePedidos({
  clientes,
  productos,
  lotesIniciales,
  pedidosIniciales,
}) {
  const [lotes, establecerLotes] = useState(() =>
    ajustarReserva(
      lotesIniciales,
      pedidosIniciales.filter((pedido) =>
        ESTADOS_EDITABLES.includes(pedido.estado),
      ),
    ),
  );
  const [pedidos, establecerPedidos] = useState(pedidosIniciales);
  const [ventas, establecerVentas] = useState([]);
  const [pestana, establecerPestana] = useState("pedidos");
  const [pedidoSeleccionado, establecerPedidoSeleccionado] = useState(null);
  const [formulario, establecerFormulario] = useState({
    cliente: "",
    producto: productos[0].nombre,
    kilos: "",
    observaciones: "",
  });
  const [detalles, establecerDetalles] = useState([]);
  const [error, establecerError] = useState("");
  const [aviso, establecerAviso] = useState("");

  function actualizarCampo(evento) {
    establecerFormulario((actual) => ({
      ...actual,
      [evento.target.name]: evento.target.value,
    }));
    establecerError("");
    establecerAviso("");
  }

  function agregarDetalle() {
    const kilos = Number(formulario.kilos);
    const producto = productos.find(
      (item) => item.nombre === formulario.producto,
    );
    if (!producto || !Number.isFinite(kilos) || kilos <= 0) {
      establecerError("Ingresá una cantidad de kilos mayor a 0.");
      return;
    }
    const kilosExistentes = detalles
      .filter((detalle) => detalle.producto === producto.nombre)
      .reduce((total, detalle) => total + detalle.kilos, 0);
    if (kilosExistentes + kilos > obtenerStock(lotes, producto.nombre)) {
      establecerError(
        `No hay stock suficiente de ${producto.nombre}. Disponible: ${obtenerStock(lotes, producto.nombre).toLocaleString("es-AR")} kg.`,
      );
      return;
    }
    establecerDetalles((actuales) => [
      ...actuales,
      { producto: producto.nombre, kilos, precioKg: producto.precioKg },
    ]);
    establecerFormulario((actual) => ({ ...actual, kilos: "" }));
    establecerError("");
  }

  function guardarPedido(evento) {
    evento.preventDefault();
    if (!formulario.cliente) {
      establecerError("Seleccioná un cliente para continuar.");
      return;
    }
    if (detalles.length === 0) {
      establecerError("Agregá al menos un producto al pedido.");
      return;
    }
    const pedido = {
      idPedido: Math.max(...pedidos.map((item) => item.idPedido), 1000) + 1,
      fecha: new Intl.DateTimeFormat("es-AR").format(new Date()),
      cliente: formulario.cliente,
      estado: "Pendiente",
      observaciones: formulario.observaciones,
      detalles,
    };
    establecerLotes((actuales) => ajustarReserva(actuales, [pedido]));
    establecerPedidos((actuales) => [pedido, ...actuales]);
    establecerFormulario({
      cliente: "",
      producto: productos[0].nombre,
      kilos: "",
      observaciones: "",
    });
    establecerDetalles([]);
    establecerAviso(
      `Pedido #${pedido.idPedido} guardado y kilos reservados correctamente.`,
    );
    establecerPestana("pedidos");
  }

  function cambiarEstadoPedido(idPedido, nuevoEstado) {
    const pedido = pedidos.find((item) => item.idPedido === idPedido);
    if (!pedido || !ESTADOS_EDITABLES.includes(pedido.estado)) return;
    if (nuevoEstado === "Cancelado") {
      establecerLotes((actuales) => ajustarReserva(actuales, [pedido], -1));
    }
    if (nuevoEstado === "Confirmado") {
      establecerLotes((actuales) => {
        const resultado = actuales.map((lote) => ({ ...lote }));
        pedido.detalles.forEach((detalle) => {
          let pendiente = detalle.kilos;
          resultado.forEach((lote) => {
            if (lote.producto !== detalle.producto || pendiente <= 0) return;
            const descuento = Math.min(lote.kilosReservados, pendiente);
            lote.kilosDisponibles -= descuento;
            lote.kilosReservados -= descuento;
            pendiente -= descuento;
          });
        });
        return resultado;
      });
      establecerVentas((actuales) => [
        {
          idVenta: actuales.length + 1,
          idPedido,
          fecha: new Intl.DateTimeFormat("es-AR").format(new Date()),
          cliente: pedido.cliente,
          total: obtenerTotal(pedido.detalles),
          kilos: obtenerKilosTotales(pedido.detalles),
        },
        ...actuales,
      ]);
    }
    establecerPedidos((actuales) =>
      actuales.map((item) =>
        item.idPedido === idPedido ? { ...item, estado: nuevoEstado } : item,
      ),
    );
    establecerAviso(
      `El pedido #${idPedido} ahora está ${nuevoEstado.toLowerCase()}.`,
    );
  }

  const pedidoActivo = pedidos.find(
    (pedido) => pedido.idPedido === pedidoSeleccionado,
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-lactarDark">
            Pedidos y Ventas
          </h2>
          <p className="text-sm text-gray-500">
            Registrá pedidos por kilo, reservá stock y confirmá ventas con
            trazabilidad.
          </p>
        </div>
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
          Stock reservado por pedido
        </span>
      </header>
      <nav
        className="flex gap-2 border-b border-gray-200"
        aria-label="Vistas de pedidos y ventas"
        role="tablist"
      >
        <button
          type="button"
          role="tab"
          onClick={() => establecerPestana("pedidos")}
          className={`border-b-2 px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 ${pestana === "pedidos" ? "border-lactarBlue text-lactarBlue" : "border-transparent text-gray-500"}`}
          aria-selected={pestana === "pedidos"}
        >
          Pedidos
        </button>
        <button
          type="button"
          role="tab"
          onClick={() => establecerPestana("ventas")}
          className={`border-b-2 px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 ${pestana === "ventas" ? "border-lactarBlue text-lactarBlue" : "border-transparent text-gray-500"}`}
          aria-selected={pestana === "ventas"}
        >
          Ventas confirmadas
        </button>
      </nav>
      {aviso && (
        <p
          role="status"
          aria-live="polite"
          className="rounded-md bg-green-50 p-3 text-sm font-medium text-green-700"
        >
          {aviso}
        </p>
      )}
      {pestana === "pedidos" ? (
        <>
          <FormularioPedido
            clientes={clientes}
            productos={productos}
            formulario={formulario}
            detalles={detalles}
            total={obtenerTotal(detalles)}
            error={error}
            aviso=""
            alCambiar={actualizarCampo}
            alAgregarDetalle={agregarDetalle}
            alQuitarDetalle={(indice) =>
              establecerDetalles((actuales) =>
                actuales.filter((_, actual) => actual !== indice),
              )
            }
            alEnviar={guardarPedido}
          />
          <TablaPedidos
            pedidos={pedidos}
            alSeleccionar={establecerPedidoSeleccionado}
            pedidoSeleccionado={pedidoSeleccionado}
          />
          {pedidoActivo && (
            <DetallePedido
              pedido={pedidoActivo}
              alCambiarEstado={cambiarEstadoPedido}
            />
          )}
        </>
      ) : (
        <TablaVentas ventas={ventas} />
      )}
    </div>
  );
}

function DetallePedido({ pedido, alCambiarEstado }) {
  const puedeCambiar = ESTADOS_EDITABLES.includes(pedido.estado);
  return (
    <section
      className="rounded-xl border border-blue-200 bg-blue-50 p-6"
      aria-label={`Detalle del pedido ${pedido.idPedido}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-blue-900">
            Detalle del pedido #{pedido.idPedido}
          </h3>
          <p className="text-sm text-gray-700">
            {pedido.cliente} · {pedido.observaciones || "Sin observaciones"}
          </p>
        </div>
        {puedeCambiar && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => alCambiarEstado(pedido.idPedido, "Preparado")}
              className="rounded bg-blue-700 px-3 py-2 text-xs font-bold text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Marcar preparado
            </button>
            <button
              type="button"
              onClick={() => alCambiarEstado(pedido.idPedido, "Confirmado")}
              className="rounded bg-green-700 px-3 py-2 text-xs font-bold text-white hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Confirmar venta
            </button>
            <button
              type="button"
              onClick={() => alCambiarEstado(pedido.idPedido, "Cancelado")}
              className="rounded bg-red-100 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
      <ul className="mt-4 divide-y divide-blue-200 text-sm text-slate-900">
        {pedido.detalles.map((detalle) => (
          <li key={detalle.producto} className="flex justify-between py-2">
            <span>
              {detalle.producto} · {detalle.kilos.toLocaleString("es-AR")} kg
            </span>
            <strong>
              ${(detalle.kilos * detalle.precioKg).toLocaleString("es-AR")}
            </strong>
          </li>
        ))}
      </ul>
    </section>
  );
}

function TablaVentas({ ventas }) {
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-6 py-4">
        <h3 className="text-lg font-bold text-blue-900">Ventas confirmadas</h3>
        <p className="text-sm text-gray-500">
          Estas operaciones ya descontaron kilos del stock disponible.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <caption className="sr-only">Listado de ventas confirmadas</caption>
          <thead className="border-b border-gray-200 bg-gray-100 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-3">Venta</th>
              <th className="px-4 py-3">Pedido</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Kilos</th>
              <th className="px-4 py-3">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-slate-900">
            {ventas.map((venta) => (
              <tr key={venta.idVenta}>
                <td className="px-4 py-3 font-bold">#{venta.idVenta}</td>
                <td className="px-4 py-3">#{venta.idPedido}</td>
                <td className="px-4 py-3">{venta.fecha}</td>
                <td className="px-4 py-3">{venta.cliente}</td>
                <td className="px-4 py-3 font-bold">
                  {venta.kilos.toLocaleString("es-AR")} kg
                </td>
                <td className="px-4 py-3 font-bold">
                  ${venta.total.toLocaleString("es-AR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {ventas.length === 0 && (
          <p className="p-6 text-sm text-gray-500">
            Todavía no hay ventas confirmadas.
          </p>
        )}
      </div>
    </section>
  );
}
