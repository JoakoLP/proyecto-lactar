"use client";

import { useState } from "react";

const PRODUCTS = [
  "Cremoso",
  "Tybo",
  "Mozzarella",
  "Pategras",
  "Fontina",
  "Sardo",
  "Reggianito",
  "Ricotta",
];

const INITIAL_LOTS = [
  {
    codigoLote: "LT-20260905-CR-001",
    fechaInicio: "05/09/2026 06:00",
    fechaFin: "-",
    producto: "Cremoso",
    litrosLeche: 5800,
    kilosObtenidos: 725,
    rendimientoReal: null,
    estado: "En producción",
  },
  {
    codigoLote: "LT-20260903-SR-001",
    fechaInicio: "03/09/2026 08:30",
    fechaFin: "05/09/2026 14:00",
    producto: "Sardo",
    litrosLeche: 5500,
    kilosObtenidos: 550,
    rendimientoReal: 10,
    estado: "En maduración",
  },
];

const STATUS_STYLES = {
  "En producción": "bg-purple-100 text-purple-800",
  "En maduración": "bg-yellow-100 text-yellow-800",
  Disponible: "bg-green-100 text-green-800",
};

function formatDate(date) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function createLotCode(product, lots) {
  const day = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const productCode = product
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const sequence = String(
    lots.filter((lot) => lot.codigoLote.startsWith(`LT-${day}-${productCode}`))
      .length + 1,
  ).padStart(3, "0");
  return `LT-${day}-${productCode}-${sequence}`;
}

export default function ProduccionPage() {
  const [lots, setLots] = useState(INITIAL_LOTS);
  const [form, setForm] = useState({
    tina: "Tina 1",
    litrosLeche: "",
    producto: PRODUCTS[0],
    kilosObtenidos: "",
    observaciones: "",
  });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const litrosLeche = Number(form.litrosLeche);
  const kilos = Number(form.kilosObtenidos);
  const previewYield =
    litrosLeche > 0 && kilos > 0
      ? ((kilos / litrosLeche) * 100).toFixed(2)
      : "-";

  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
    setError("");
    setNotice("");
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (
      !Number.isFinite(litrosLeche) ||
      litrosLeche <= 0 ||
      litrosLeche > 5800
    ) {
      setError(
        "La leche ingresada debe ser mayor a 0 y no superar los 5.800 litros.",
      );
      return;
    }
    if (!Number.isFinite(kilos) || kilos <= 0) {
      setError("Los kilos obtenidos deben ser mayores a 0.");
      return;
    }
    if (form.observaciones.length > 45) {
      setError("Las observaciones no pueden superar los 45 caracteres.");
      return;
    }
    const newLot = {
      codigoLote: createLotCode(form.producto, lots),
      tina: form.tina,
      fechaInicio: formatDate(new Date()),
      fechaFin: "-",
      producto: form.producto,
      litrosLeche: litrosLeche,
      kilosObtenidos: kilos,
      rendimientoReal: null,
      estado: "En producción",
      observaciones: form.observaciones,
    };
    setLots((current) => [newLot, ...current]);
    setForm((current) => ({
      ...current,
      litrosLeche: "",
      kilosObtenidos: "",
      observaciones: "",
    }));
    setNotice(`Lote ${newLot.codigoLote} iniciado correctamente.`);
  }

  function closeLot(code) {
    setLots((current) =>
      current.map((lot) => {
        if (lot.codigoLote !== code || lot.estado !== "En producción")
          return lot;
        return {
          ...lot,
          fechaFin: formatDate(new Date()),
          rendimientoReal: (
            (lot.kilosObtenidos / lot.litrosLeche) *
            100
          ).toFixed(2),
          estado: "En maduración",
        };
      }),
    );
    setNotice(`El lote ${code} fue cerrado y pasó a maduración.`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-lactarDark">
            Producción y Tinas
          </h2>
          <p className="text-sm text-gray-500">
            Iniciá lotes, controlá la producción y cerrá cada proceso con su
            rinde real.
          </p>
        </div>
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
          Capacidad por tina: 5.800 L
        </span>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 border-b border-gray-200 pb-3 text-lg font-bold text-blue-900">
          Registrar nueva producción
        </h3>
        <form
          className="grid grid-cols-1 items-end gap-4 md:grid-cols-2 xl:grid-cols-6"
          onSubmit={handleSubmit}
        >
          <div>
            <label
              htmlFor="tina"
              className="mb-1 block text-sm font-bold text-gray-800"
            >
              Tina utilizada
            </label>
            <select
              id="tina"
              name="tina"
              value={form.tina}
              onChange={updateField}
              className="w-full rounded-lg border border-gray-300 p-2.5 font-normal text-black focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              <option className="font-normal">Tina 1</option>
              <option className="font-normal">Tina 2</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="litrosLeche"
              className="mb-1 block text-sm font-bold text-gray-800"
            >
              Leche ingresada (L)
            </label>
            <input
              id="litrosLeche"
              name="litrosLeche"
              type="number"
              min="0.01"
              max="5800"
              step="0.01"
              value={form.litrosLeche}
              onChange={updateField}
              placeholder="Máximo 5.800"
              required
              className="w-full rounded-lg border border-gray-300 p-2.5 font-normal text-black focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="producto"
              className="mb-1 block text-sm font-bold text-gray-800"
            >
              Producto
            </label>
            <select
              id="producto"
              name="producto"
              value={form.producto}
              onChange={updateField}
              className="w-full rounded-lg border border-gray-300 p-2.5 font-normal text-black focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              {PRODUCTS.map((product) => (
                <option key={product} className="font-normal">
                  {product}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="kilosObtenidos"
              className="mb-1 block text-sm font-bold text-gray-800"
            >
              Queso obtenido (kg)
            </label>
            <input
              id="kilosObtenidos"
              name="kilosObtenidos"
              type="number"
              min="0.01"
              step="0.01"
              value={form.kilosObtenidos}
              onChange={updateField}
              placeholder="Ej: 725"
              required
              className="w-full rounded-lg border border-gray-300 p-2.5 font-normal text-black focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="observaciones"
              className="mb-1 block text-sm font-bold text-gray-800"
            >
              Observaciones
            </label>
            <input
              id="observaciones"
              name="observaciones"
              type="text"
              maxLength="45"
              value={form.observaciones}
              onChange={updateField}
              placeholder="Opcional"
              className="w-full rounded-lg border border-gray-300 p-2.5 font-normal text-black focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-lactarBlue p-2.5 font-bold text-white shadow-sm transition-colors hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Guardar lote
          </button>
        </form>
        <div
          className="mt-4 flex flex-wrap items-center gap-4 text-sm"
          aria-live="polite"
        >
          <span className="font-bold text-gray-800">
            Rinde estimado:{" "}
            <strong className="text-lactarDark">
              {previewYield}
              {previewYield === "-" ? "" : "%"}
            </strong>
          </span>
          <span className="font-semibold text-gray-700">
            El rinde real se confirma al cerrar el lote.
          </span>
        </div>
        {error && (
          <p
            role="alert"
            className="mt-3 rounded-md bg-red-50 p-3 text-sm font-medium text-red-700"
          >
            {error}
          </p>
        )}
        {notice && (
          <p
            role="status"
            className="mt-3 rounded-md bg-green-50 p-3 text-sm font-medium text-green-700"
          >
            {notice}
          </p>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-bold text-blue-900">Lotes registrados</h3>
          <p className="text-sm text-gray-500">
            El stock se calculará a partir de los lotes disponibles.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <caption className="sr-only">
              Listado de lotes de producción
            </caption>
            <thead className="border-b border-gray-200 bg-gray-100 text-xs uppercase text-gray-600">
              <tr>
                {[
                  "Código",
                  "Tina",
                  "Inicio",
                  "Fin",
                  "Producto",
                  "Leche",
                  "Queso",
                  "Rinde",
                  "Estado",
                  "Acción",
                ].map((heading) => (
                  <th key={heading} scope="col" className="px-4 py-3">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {lots.map((lot) => (
                <tr key={lot.codigoLote} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 font-mono font-bold text-gray-900">
                    {lot.codigoLote}
                  </td>
                  <td className="px-4 py-3">{lot.tina || "-"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {lot.fechaInicio}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {lot.fechaFin}
                  </td>
                  <td className="px-4 py-3 font-medium">{lot.producto}</td>
                  <td className="px-4 py-3">
                    {lot.litrosLeche.toLocaleString("es-AR")} L
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {lot.kilosObtenidos.toLocaleString("es-AR")} kg
                  </td>
                  <td
                    className={`px-4 py-3 font-bold ${lot.rendimientoReal ? "text-green-600" : "text-gray-400"}`}
                  >
                    {lot.rendimientoReal
                      ? `${lot.rendimientoReal}%`
                      : "Pendiente"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`whitespace-nowrap rounded-full px-2 py-1 text-xs font-bold ${STATUS_STYLES[lot.estado] || "bg-gray-100 text-gray-700"}`}
                    >
                      {lot.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {lot.estado === "En producción" && (
                      <button
                        type="button"
                        onClick={() => closeLot(lot.codigoLote)}
                        className="font-semibold text-blue-700 hover:text-blue-900 focus:outline-none focus:underline"
                      >
                        Cerrar lote
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
