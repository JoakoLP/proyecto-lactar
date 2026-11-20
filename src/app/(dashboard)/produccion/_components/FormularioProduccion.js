"use client";

const claseEntrada =
  "w-full rounded-lg border border-gray-300 p-2.5 font-normal text-black focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500";

export default function FormularioProduccion({
  tinas,
  productos,
  formulario,
  isSubmitting,
  isLoadingCatalogos,
  error,
  aviso,
  alCambiar,
  alEnviar,
}) {
  const tinaSeleccionada = tinas.find(
    (tina) => String(tina.idTina) === String(formulario.idTina),
  );
  const productoSeleccionado = productos.find(
    (producto) => String(producto.idProducto) === String(formulario.idProducto),
  );

  const capacidadMaxima = tinaSeleccionada?.capacidadLitros ?? 5800;
  const rendimientoEsperado = productoSeleccionado?.rendimientoEsperado;
  const tieneRendimientoEsperado =
    rendimientoEsperado !== undefined &&
    rendimientoEsperado !== null &&
    Number.isFinite(Number(rendimientoEsperado));

  const sinCatalogos = tinas.length === 0 || productos.length === 0;
  const deshabilitado = isSubmitting || isLoadingCatalogos || sinCatalogos;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 border-b border-gray-200 pb-3 text-lg font-bold text-blue-900">
        Registrar nueva producción
      </h3>
      <form
        className="grid grid-cols-1 items-end gap-4 md:grid-cols-2 xl:grid-cols-5"
        onSubmit={alEnviar}
      >
        <Campo label="Tina utilizada" id="idTina">
          <select
            id="idTina"
            name="idTina"
            value={formulario.idTina}
            onChange={alCambiar}
            disabled={isSubmitting || isLoadingCatalogos || tinas.length === 0}
            required
            className={`${claseEntrada} bg-white`}
          >
            {tinas.length === 0 ? (
              <option value="">
                {isLoadingCatalogos ? "Cargando tinas..." : "Sin tinas disponibles"}
              </option>
            ) : (
              tinas.map((tina) => (
                <option key={tina.idTina} value={tina.idTina}>
                  Tina {tina.idTina} (Máx.{" "}
                  {Number(tina.capacidadLitros).toLocaleString("es-AR")} L)
                </option>
              ))
            )}
          </select>
        </Campo>

        <Campo label="Leche ingresada (L)" id="litrosLeche">
          <input
            id="litrosLeche"
            name="litrosLeche"
            type="number"
            min="0.01"
            max={capacidadMaxima}
            step="0.01"
            value={formulario.litrosLeche}
            onChange={alCambiar}
            placeholder={`Máximo ${Number(capacidadMaxima).toLocaleString("es-AR")}`}
            disabled={deshabilitado}
            required
            className={claseEntrada}
          />
        </Campo>

        <Campo label="Producto" id="idProducto">
          <select
            id="idProducto"
            name="idProducto"
            value={formulario.idProducto}
            onChange={alCambiar}
            disabled={
              isSubmitting || isLoadingCatalogos || productos.length === 0
            }
            required
            className={`${claseEntrada} bg-white`}
          >
            {productos.length === 0 ? (
              <option value="">
                {isLoadingCatalogos
                  ? "Cargando productos..."
                  : "Sin productos disponibles"}
              </option>
            ) : (
              productos.map((producto) => (
                <option key={producto.idProducto} value={producto.idProducto}>
                  {producto.nombre}
                </option>
              ))
            )}
          </select>
        </Campo>

        <Campo label="Observaciones" id="observaciones">
          <input
            id="observaciones"
            name="observaciones"
            type="text"
            maxLength={255}
            value={formulario.observaciones}
            onChange={alCambiar}
            placeholder="Opcional (máx. 255 caracteres)"
            disabled={deshabilitado}
            className={claseEntrada}
          />
        </Campo>

        <button
          type="submit"
          disabled={deshabilitado}
          className="rounded-lg bg-lactarBlue p-2.5 font-bold text-white shadow-sm transition-colors hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Iniciando..." : "Iniciar producción"}
        </button>
      </form>

      <div
        className="mt-4 flex flex-wrap items-center gap-4 text-sm"
        aria-live="polite"
      >
        <span className="font-bold text-gray-800">
          Rinde esperado del producto:{" "}
          <strong className="text-lactarDark">
            {tieneRendimientoEsperado
              ? `${Number(rendimientoEsperado).toFixed(2)}%`
              : "No especificado"}
          </strong>
        </span>
        <span className="font-semibold text-gray-700">
          El código de lote se genera automáticamente y el rinde real se calcula
          al cargar los kilos obtenidos o cerrar el lote.
        </span>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800"
        >
          {error}
        </p>
      )}
      {aviso && (
        <p
          role="status"
          className="mt-3 rounded-md border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-800"
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
