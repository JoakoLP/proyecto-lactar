"use client";

import { useEffect, useState } from "react";
import { getClientes } from "@/services/clientes";
import {
  cambiarEstadoPedido as actualizarEstadoPedido,
  createPedido,
  getPedidos,
} from "@/services/pedidos";
import { getProductos } from "@/services/productos";
import { getStock } from "@/services/stock";
import FormularioPedido from "./FormularioPedido";
import TablaPedidos from "./TablaPedidos";

const ESTADOS_EDITABLES = ["Pendiente", "En preparación", "Preparado"];

function mapearPedido(pedido) {
  return {
    idPedido: pedido.idPedido,
    fecha: new Date(`${pedido.fecha}T00:00:00`).toLocaleDateString("es-AR"),
    cliente: pedido.cliente.razonSocial,
    estado: pedido.estado_pedido.nombre,
    observaciones: pedido.observaciones || "",
    detalles: (pedido.detalle_pedido ?? []).map((detalle) => ({
      idProducto: detalle.producto.idProducto,
      producto: detalle.producto.nombre,
      kilos: Number(detalle.kilosSolicitados),
      precioKg: Number(detalle.precioKg),
      cantidadPiezas: Number(detalle.cantidadPiezas),
      asignaciones: detalle.asignacion_lote ?? [],
    })),
  };
}

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

export default function ClientePedidos() {
  const [clientes, establecerClientes] = useState([]);
  const [productos, establecerProductos] = useState([]);
  const [lotes, establecerLotes] = useState([]);
  const [pedidos, establecerPedidos] = useState([]);
  const [ventas, establecerVentas] = useState([]);
  const [pestana, establecerPestana] = useState("pedidos");
  const [pedidoSeleccionado, establecerPedidoSeleccionado] = useState(null);
  const [pedidoActualizando, establecerPedidoActualizando] = useState(null);
  const [cargando, establecerCargando] = useState(true);
  const [errorCarga, establecerErrorCarga] = useState("");
  const [intentoCarga, establecerIntentoCarga] = useState(0);
  const [pedidoEnviando, establecerPedidoEnviando] = useState(false);
  const [formulario, establecerFormulario] = useState({
    cliente: "",
    producto: "",
    kilos: "",
    observaciones: "",
  });
  const [detalles, establecerDetalles] = useState([]);
  const [error, establecerError] = useState("");
  const [aviso, establecerAviso] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      getClientes({ signal: controller.signal }),
      getProductos({ signal: controller.signal }),
      getPedidos({ signal: controller.signal }),
      getStock({ signal: controller.signal }),
    ])
      .then(([clientesRecibidos, productosRecibidos, pedidosRecibidos, lotes]) => {
        if (controller.signal.aborted) return;

        establecerClientes(
          clientesRecibidos.filter((cliente) => cliente.estado === "Activo"),
        );
        establecerProductos(productosRecibidos);
        establecerPedidos(pedidosRecibidos.map(mapearPedido));
        establecerLotes(lotes);
        establecerFormulario((actual) => ({
          ...actual,
          producto: productosRecibidos[0]?.idProducto?.toString() ?? "",
        }));
      })
      .catch((error) => {
        if (!controller.signal.aborted && error.name !== "AbortError") {
          establecerErrorCarga(error.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          establecerCargando(false);
        }
      });

    return () => controller.abort();
  }, [intentoCarga]);

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
      (item) => String(item.idProducto) === formulario.producto,
    );
    if (!producto || !Number.isFinite(kilos) || kilos <= 0) {
      establecerError("Ingresá una cantidad de kilos mayor a 0.");
      return;
    }
    const kilosExistentes = detalles
      .filter((detalle) => detalle.idProducto === producto.idProducto)
      .reduce((total, detalle) => total + detalle.kilos, 0);
    if (kilosExistentes + kilos > obtenerStock(lotes, producto.nombre)) {
      establecerError(
        `No hay stock suficiente de ${producto.nombre}. Disponible: ${obtenerStock(lotes, producto.nombre).toLocaleString("es-AR")} kg.`,
      );
      return;
    }
    establecerDetalles((actuales) => [
      ...actuales,
      {
        idProducto: producto.idProducto,
        producto: producto.nombre,
        kilos,
        precioKg: producto.precioKg,
      },
    ]);
    establecerFormulario((actual) => ({ ...actual, kilos: "" }));
    establecerError("");
  }

  async function guardarPedido(evento) {
    evento.preventDefault();
    if (pedidoEnviando) return;
    if (!formulario.cliente) {
      establecerError("Seleccioná un cliente para continuar.");
      return;
    }
    if (detalles.length === 0) {
      establecerError("Agregá al menos un producto al pedido.");
      return;
    }
    establecerPedidoEnviando(true);
    establecerError("");
    establecerAviso("");

    let pedidoCreado;
    try {
      pedidoCreado = await createPedido({
        idCliente: Number(formulario.cliente),
        observaciones: formulario.observaciones,
        detalles: detalles.map((detalle) => ({
          idProducto: detalle.idProducto,
          cantidadPiezas: detalle.cantidadPiezas ?? 1,
          kilosSolicitados: detalle.kilos,
        })),
      });

      establecerFormulario({
        cliente: "",
        producto: productos[0]?.idProducto?.toString() ?? "",
        kilos: "",
        observaciones: "",
      });
      establecerDetalles([]);
      establecerAviso(
        `Pedido #${pedidoCreado.idPedido} guardado y kilos reservados correctamente.`,
      );
      establecerPestana("pedidos");

      try {
        const [pedidosActualizados, lotesActualizados] = await Promise.all([
          getPedidos(),
          getStock(),
        ]);
        establecerPedidos(pedidosActualizados.map(mapearPedido));
        establecerLotes(lotesActualizados);
      } catch (errorActualizacion) {
        establecerError(
          `El pedido #${pedidoCreado.idPedido} se registró, pero no se pudo actualizar la vista: ${errorActualizacion.message}`,
        );
      }
    } catch (error) {
      establecerError(error.message);
    } finally {
      establecerPedidoEnviando(false);
    }
  }

  async function cambiarEstadoPedido(idPedido, nuevoEstado) {
    const pedido = pedidos.find((item) => item.idPedido === idPedido);
    if (!pedido || !ESTADOS_EDITABLES.includes(pedido.estado)) return;

    if (nuevoEstado !== "Confirmado") {
      establecerPedidoActualizando(idPedido);
      establecerError("");
      establecerAviso("");
      try {
        const actualizado = await actualizarEstadoPedido(idPedido, nuevoEstado);
        establecerPedidos((actuales) =>
          actuales.map((item) =>
            item.idPedido === idPedido
              ? { ...item, estado: actualizado.estado }
              : item,
          ),
        );

        if (nuevoEstado === "Cancelado") {
          try {
            establecerLotes(await getStock());
          } catch (errorActualizacion) {
            establecerError(
              `El pedido fue cancelado, pero no se pudo actualizar el stock: ${errorActualizacion.message}`,
            );
          }
        }

        establecerAviso(
          `El pedido #${idPedido} ahora está ${actualizado.estado.toLowerCase()}.`,
        );
      } catch (error) {
        establecerError(error.message);
      } finally {
        establecerPedidoActualizando(null);
      }
      return;
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
      {cargando ? (
        <p role="status" aria-live="polite" className="text-sm text-gray-600">
          Cargando clientes, productos, pedidos y stock...
        </p>
      ) : errorCarga ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <p>No se pudieron cargar los datos: {errorCarga}</p>
          <button
            type="button"
            onClick={() => {
              establecerErrorCarga("");
              establecerCargando(true);
              establecerIntentoCarga((actual) => actual + 1);
            }}
            className="mt-3 rounded-lg bg-red-700 px-4 py-2 font-semibold text-white hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-offset-2"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <>
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
                enviando={pedidoEnviando}
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
                  actualizando={pedidoActualizando === pedidoActivo.idPedido}
                />
              )}
            </>
          ) : (
            <TablaVentas ventas={ventas} />
          )}
        </>
      )}
    </div>
  );
}

function DetallePedido({ pedido, alCambiarEstado, actualizando }) {
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
            {pedido.estado === "Pendiente" && (
              <button
                type="button"
                onClick={() =>
                  alCambiarEstado(pedido.idPedido, "En preparación")
                }
                disabled={actualizando}
                className="rounded bg-blue-700 px-3 py-2 text-xs font-bold text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Iniciar preparación
              </button>
            )}
            {pedido.estado === "En preparación" && (
              <button
                type="button"
                onClick={() => alCambiarEstado(pedido.idPedido, "Preparado")}
                disabled={actualizando}
                className="rounded bg-blue-700 px-3 py-2 text-xs font-bold text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Marcar preparado
              </button>
            )}
            <button
              type="button"
              onClick={() => alCambiarEstado(pedido.idPedido, "Confirmado")}
              disabled={actualizando}
              className="rounded bg-green-700 px-3 py-2 text-xs font-bold text-white hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Confirmar venta
            </button>
            <button
              type="button"
              onClick={() => alCambiarEstado(pedido.idPedido, "Cancelado")}
              disabled={actualizando}
              className="rounded bg-red-100 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
      {actualizando && (
        <p role="status" aria-live="polite" className="mt-3 text-sm text-gray-700">
          Actualizando el estado del pedido...
        </p>
      )}
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
