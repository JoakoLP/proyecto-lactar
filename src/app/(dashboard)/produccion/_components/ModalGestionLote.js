"use client";

import { useEffect, useState } from "react";
import { actualizarLote } from "@/services/produccion";
import {
  ESTADOS_LOTE,
  NOMBRES_ESTADO_LOTE,
  TRANSICIONES_ESTADO_LOTE,
} from "@/utils/produccionValidation";

function ModalGestionLoteContenido({ lote, onClose, onSaved }) {
  const opcionesEstado = Array.from(
    TRANSICIONES_ESTADO_LOTE[lote.idEstadoLote] ?? [],
  );
  const estadoInicial = opcionesEstado[0] ?? lote.idEstadoLote;

  const [idEstadoLote, setIdEstadoLote] = useState(String(estadoInicial));
  const [kilosObtenidos, setKilosObtenidos] = useState(
    Number(lote.kilosObtenidos) > 0 ? String(lote.kilosObtenidos) : "",
  );
  const [observaciones, setObservaciones] = useState(lote.observaciones ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape" && !isSaving) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSaving, onClose]);

  const estadoDestinoNum = Number(idEstadoLote);
  const requiereKilos =
    lote.idEstadoLote === ESTADOS_LOTE.EN_PRODUCCION ||
    (estadoDestinoNum === ESTADOS_LOTE.CERRADO &&
      Number(lote.kilosObtenidos ?? 0) <= 0);

  const kilosNum = Number(kilosObtenidos);
  const litrosLeche = Number(lote.litrosLeche);
  const rindePrevio =
    Number.isFinite(kilosNum) && kilosNum > 0 && litrosLeche > 0
      ? ((kilosNum / litrosLeche) * 100).toFixed(2)
      : null;

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError("");

    const payload = {
      idEstadoLote: estadoDestinoNum,
      observaciones: observaciones.trim() || null,
    };

    if (kilosObtenidos.trim() !== "") {
      if (!Number.isFinite(kilosNum) || kilosNum <= 0) {
        setSubmitError(
          "Los kilos obtenidos deben ser un número mayor a 0.",
        );
        return;
      }
      payload.kilosObtenidos = kilosNum;
    } else if (requiereKilos && Number(lote.kilosObtenidos ?? 0) <= 0) {
      setSubmitError(
        "Debe ingresar los kilos obtenidos (> 0) para cerrar o finalizar la producción.",
      );
      return;
    }

    setIsSaving(true);
    try {
      const actualizado = await actualizarLote(lote.codigoLote, payload);
      await onSaved(actualizado);
      onClose();
    } catch (err) {
      setSubmitError(err?.message || "No se pudo actualizar el lote.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm transition-opacity"
      onClick={() => !isSaving && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-gestion-lote-titulo"
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div>
            <h2
              id="modal-gestion-lote-titulo"
              className="text-lg font-bold text-blue-900"
            >
              {lote.idEstadoLote === ESTADOS_LOTE.EN_PRODUCCION
                ? "Cerrar / Gestionar Producción"
                : "Gestionar Estado del Lote"}
            </h2>
            <p className="font-mono text-xs font-semibold text-gray-600">
              {lote.codigoLote} · {lote.producto?.nombre ?? "-"} (
              {litrosLeche.toLocaleString("es-AR")} L)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="text-gray-500 transition-colors hover:text-gray-700 disabled:opacity-50"
            aria-label="Cerrar modal"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {submitError && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
            >
              {submitError}
            </div>
          )}

          <div>
            <label
              htmlFor="gestion-estado"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Nuevo estado del lote (Actual:{" "}
              {NOMBRES_ESTADO_LOTE[lote.idEstadoLote] ?? "-"})
            </label>
            <select
              id="gestion-estado"
              value={idEstadoLote}
              onChange={(e) => setIdEstadoLote(e.target.value)}
              disabled={isSaving}
              className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              {opcionesEstado.map((id) => (
                <option key={id} value={id}>
                  {NOMBRES_ESTADO_LOTE[id]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="gestion-kilos"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Queso obtenido (kg){requiereKilos ? " *" : " (opcional)"}
            </label>
            <input
              id="gestion-kilos"
              type="number"
              min="0.01"
              max="999999.99"
              step="0.01"
              value={kilosObtenidos}
              onChange={(e) => setKilosObtenidos(e.target.value)}
              required={requiereKilos}
              disabled={isSaving}
              placeholder="Ej: 540.50"
              className="w-full rounded-lg border border-gray-300 p-2.5 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            {rindePrevio && (
              <p className="mt-1 text-xs font-semibold text-blue-800">
                Rinde estimado a registrar: {rindePrevio}%
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="gestion-observaciones"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Observaciones
            </label>
            <input
              id="gestion-observaciones"
              type="text"
              maxLength={255}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              disabled={isSaving}
              placeholder="Opcional (máx. 255 caracteres)"
              className="w-full rounded-lg border border-gray-300 p-2.5 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          <div className="mt-6 flex justify-end space-x-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg border border-transparent bg-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSaving ? "Guardando..." : "Confirmar actualización"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ModalGestionLote({ isOpen, lote, onClose, onSaved }) {
  if (!isOpen || !lote) return null;
  return (
    <ModalGestionLoteContenido
      key={lote.codigoLote}
      lote={lote}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}
