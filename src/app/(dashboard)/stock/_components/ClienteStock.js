"use client";

import { useEffect, useState } from "react";
import { getProductos } from "@/services/productos";
import { getStock } from "@/services/stock";
import TablaStock from "./TablaStock";

function calcularResumen(lotes, catalogoProductos, filtroProducto) {
  const mapa = new Map();

  for (const prod of catalogoProductos) {
    if (filtroProducto !== "Todos" && prod.nombre !== filtroProducto) continue;
    mapa.set(prod.nombre, {
      nombre: prod.nombre,
      kilos: 0,
      lotes: 0,
    });
  }

  for (const lote of lotes) {
    if (filtroProducto !== "Todos" && lote.producto !== filtroProducto) continue;
    const existente = mapa.get(lote.producto);
    if (existente) {
      existente.kilos += lote.stockDisponible;
      existente.lotes += 1;
    } else {
      mapa.set(lote.producto, {
        nombre: lote.producto,
        kilos: lote.stockDisponible,
        lotes: 1,
      });
    }
  }

  return Array.from(mapa.values()).sort((a, b) => {
    if (b.kilos !== a.kilos) return b.kilos - a.kilos;
    return a.nombre.localeCompare(b.nombre, "es");
  });
}

export default function ClienteStock() {
  const [lotes, establecerLotes] = useState([]);
  const [catalogoProductos, establecerCatalogoProductos] = useState([]);
  const [cargando, establecerCargando] = useState(true);
  const [error, establecerError] = useState("");
  const [intento, establecerIntento] = useState(0);
  const [filtroProducto, establecerFiltroProducto] = useState("Todos");
  const [mostrarSinStock, establecerMostrarSinStock] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      getStock({ signal: controller.signal }),
      getProductos({ signal: controller.signal }),
    ])
      .then(([lotesRecibidos, productosRecibidos]) => {
        if (!controller.signal.aborted) {
          establecerLotes(lotesRecibidos);
          establecerCatalogoProductos(productosRecibidos);
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted && error.name !== "AbortError") {
          establecerError(error.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          establecerCargando(false);
        }
      });

    return () => controller.abort();
  }, [intento]);

  const nombresProductos = Array.from(
    new Set([
      ...catalogoProductos.map((producto) => producto.nombre),
      ...lotes.map((lote) => lote.producto),
    ]),
  ).sort((a, b) => a.localeCompare(b, "es"));

  const productos = ["Todos", ...nombresProductos];
  const lotesFiltrados = lotes.filter(
    (lote) => filtroProducto === "Todos" || lote.producto === filtroProducto,
  );
  const lotesConStock = lotesFiltrados.filter(
    (lote) => lote.stockDisponible > 0,
  );
  const resumen = calcularResumen(
    lotesConStock,
    catalogoProductos,
    filtroProducto,
  );
  const cantidadSinStock = resumen.filter((p) => p.kilos <= 0).length;
  const resumenVisible = mostrarSinStock
    ? resumen
    : resumen.filter((p) => p.kilos > 0);
  const productosConStockCount = resumen.filter((p) => p.kilos > 0).length;
  const kilosTotales = lotesFiltrados.reduce(
    (total, lote) => total + lote.stockDisponible,
    0,
  );
  const cantidadLotes = lotesConStock.length;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-lactarDark">Stock y Lotes</h2>
          <p className="text-sm text-gray-500">
            Consultá el stock neto disponible y las reservas por lote.
          </p>
        </div>
        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
          Stock actualizado
        </span>
      </header>

      {cargando ? (
        <p role="status" aria-live="polite" className="text-sm text-gray-600">
          Cargando stock...
        </p>
      ) : error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <p>No se pudo cargar el stock: {error}</p>
          <button
            type="button"
            onClick={() => {
              establecerCargando(true);
              establecerError("");
              establecerIntento((actual) => actual + 1);
            }}
            className="mt-3 rounded-lg bg-red-700 px-4 py-2 font-semibold text-white hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-offset-2"
          >
            Reintentar
          </button>
        </div>
      ) : lotes.length === 0 && catalogoProductos.length === 0 ? (
        <p
          role="status"
          aria-live="polite"
          className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600"
        >
          No hay productos ni lotes con stock para mostrar.
        </p>
      ) : (
        <>
          <section
            className="grid grid-cols-1 gap-4 md:grid-cols-3"
            aria-label="Resumen del stock"
          >
            <Resumen
              titulo="Kilos disponibles"
              valor={`${kilosTotales.toLocaleString("es-AR")} kg`}
              color="text-green-700"
            />
            <Resumen
              titulo="Lotes disponibles"
              valor={cantidadLotes}
              color="text-blue-700"
            />
            <Resumen
              titulo="Productos en stock"
              valor={productosConStockCount}
              color="text-lactarDark"
            />
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-bold text-blue-900">
                  Existencias por producto
                </h3>
                <p className="text-sm text-gray-500">
                  Los kilos reflejan el stock neto, luego de descontar las
                  reservas. Incluye todos los productos registrados en catálogo.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  aria-pressed={mostrarSinStock}
                  onClick={() => establecerMostrarSinStock((actual) => !actual)}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    mostrarSinStock
                      ? "border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {mostrarSinStock
                    ? `Ocultar sin stock (${cantidadSinStock})`
                    : `Mostrar sin stock (${cantidadSinStock})`}
                </button>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                  Producto
                  <select
                    value={filtroProducto}
                    onChange={(evento) =>
                      establecerFiltroProducto(evento.target.value)
                    }
                    className="rounded-lg border border-gray-300 p-2.5 font-normal text-black focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  >
                    {productos.map((producto) => (
                      <option key={producto}>{producto}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              {resumenVisible.length > 0 ? (
                resumenVisible.map((producto) => {
                  const sinStock = producto.kilos <= 0;
                  return (
                    <div
                      key={producto.nombre}
                      className={`rounded-lg border p-4 ${
                        sinStock
                          ? "border-dashed border-gray-200 bg-gray-50/70"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-700">
                          {producto.nombre}
                        </p>
                        {sinStock && (
                          <span className="rounded bg-gray-200 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                            Sin stock
                          </span>
                        )}
                      </div>
                      <p
                        className={`mt-1 text-2xl font-bold ${
                          sinStock ? "text-gray-400" : "text-lactarDark"
                        }`}
                      >
                        {producto.kilos.toLocaleString("es-AR")} kg
                      </p>
                      <p className="text-xs text-gray-500">
                        {producto.lotes}{" "}
                        {producto.lotes === 1 ? "lote" : "lotes"}
                      </p>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-600">
                  {resumen.length > 0 && !mostrarSinStock
                    ? "No hay productos con stock neto para el filtro seleccionado. Activá «Mostrar sin stock» para verlos."
                    : "No hay productos registrados para mostrar."}
                </p>
              )}
            </div>
          </section>

          <TablaStock lotes={lotesFiltrados} />
        </>
      )}
    </div>
  );
}

function Resumen({ titulo, valor, color }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-gray-500">{titulo}</p>
      <p className={`mt-2 text-2xl font-bold ${color}`}>{valor}</p>
    </div>
  );
}
