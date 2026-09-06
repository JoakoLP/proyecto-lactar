"use client";

import { useState } from "react";
import TablaStock from "./TablaStock";

function calcularResumen(lotes) {
  return lotes.reduce((resumen, lote) => {
    const existente = resumen.find(
      (producto) => producto.nombre === lote.producto,
    );
    if (existente) {
      existente.kilos += lote.kilosDisponibles;
      existente.lotes += 1;
    } else {
      resumen.push({
        nombre: lote.producto,
        kilos: lote.kilosDisponibles,
        lotes: 1,
      });
    }
    return resumen;
  }, []);
}

export default function ClienteStock({ lotesIniciales }) {
  const [filtroProducto, establecerFiltroProducto] = useState("Todos");
  const lotesDisponibles = lotesIniciales.filter(
    (lote) => lote.estado === "Disponible",
  );
  const productos = [
    "Todos",
    ...new Set(lotesDisponibles.map((lote) => lote.producto)),
  ];
  const lotesFiltrados = lotesDisponibles.filter(
    (lote) => filtroProducto === "Todos" || lote.producto === filtroProducto,
  );
  const resumen = calcularResumen(lotesFiltrados);
  const kilosTotales = lotesFiltrados.reduce(
    (total, lote) => total + lote.kilosDisponibles,
    0,
  );
  const cantidadLotes = lotesFiltrados.length;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-lactarDark">Stock y Lotes</h2>
          <p className="text-sm text-gray-500">
            Consultá el stock disponible calculado desde los lotes terminados.
          </p>
        </div>
        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
          Solo lotes disponibles
        </span>
      </header>

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
          valor={resumen.length}
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
              Los kilos se suman automáticamente desde los lotes disponibles.
            </p>
          </div>
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
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          {resumen.map((producto) => (
            <div
              key={producto.nombre}
              className="rounded-lg border border-gray-200 bg-gray-50 p-4"
            >
              <p className="text-sm font-semibold text-gray-600">
                {producto.nombre}
              </p>
              <p className="mt-1 text-2xl font-bold text-lactarDark">
                {producto.kilos.toLocaleString("es-AR")} kg
              </p>
              <p className="text-xs text-gray-500">
                {producto.lotes} {producto.lotes === 1 ? "lote" : "lotes"}
              </p>
            </div>
          ))}
        </div>
      </section>

      <TablaStock lotes={lotesFiltrados} />
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
