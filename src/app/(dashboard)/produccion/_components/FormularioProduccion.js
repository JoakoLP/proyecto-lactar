"use client";

const TANQUES = ["Tina 1", "Tina 2"];
const claseEntrada =
  "w-full rounded-lg border border-gray-300 p-2.5 font-normal text-black focus:border-blue-500 focus:ring-2 focus:ring-blue-500";

export default function FormularioProduccion({
  productos,
  formulario,
  rendimientoEstimado,
  error,
  aviso,
  alCambiar,
  alEnviar,
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 border-b border-gray-200 pb-3 text-lg font-bold text-blue-900">
        Registrar nueva producción
      </h3>
      <form
        className="grid grid-cols-1 items-end gap-4 md:grid-cols-2 xl:grid-cols-6"
        onSubmit={alEnviar}
      >
        <Campo label="Tina utilizada" id="tina">
          <select
            id="tina"
            name="tina"
            value={formulario.tina}
            onChange={alCambiar}
            className={claseEntrada}
          >
            {TANQUES.map((tina) => (
              <option key={tina}>{tina}</option>
            ))}
          </select>
        </Campo>
        <Campo label="Leche ingresada (L)" id="litrosLeche">
          <input
            id="litrosLeche"
            name="litrosLeche"
            type="number"
            min="0.01"
            max="5800"
            step="0.01"
            value={formulario.litrosLeche}
            onChange={alCambiar}
            placeholder="Máximo 5.800"
            required
            className={claseEntrada}
          />
        </Campo>
        <Campo label="Producto" id="producto">
          <select
            id="producto"
            name="producto"
            value={formulario.producto}
            onChange={alCambiar}
            className={claseEntrada}
          >
            {productos.map((producto) => (
              <option key={producto}>{producto}</option>
            ))}
          </select>
        </Campo>
        <Campo label="Queso obtenido (kg)" id="kilosObtenidos">
          <input
            id="kilosObtenidos"
            name="kilosObtenidos"
            type="number"
            min="0.01"
            step="0.01"
            value={formulario.kilosObtenidos}
            onChange={alCambiar}
            placeholder="Ej: 725"
            required
            className={claseEntrada}
          />
        </Campo>
        <Campo label="Observaciones" id="observaciones">
          <input
            id="observaciones"
            name="observaciones"
            type="text"
            maxLength="45"
            value={formulario.observaciones}
            onChange={alCambiar}
            placeholder="Opcional"
            className={claseEntrada}
          />
        </Campo>
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
            {rendimientoEstimado}
            {rendimientoEstimado === "-" ? "" : "%"}
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
      {aviso && (
        <p
          role="status"
          className="mt-3 rounded-md bg-green-50 p-3 text-sm font-medium text-green-700"
        >
          {aviso}
        </p>
      )}
    </section>
  );
}

function Campo({ label, id, children }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-sm font-bold text-gray-800"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
