"use client";

import { useState } from "react";
import TablaLotes from "./TablaLotes";
import FormularioProduccion from "./FormularioProduccion";

function formatearFecha(fecha) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(fecha);
}

function crearCodigoLote(producto, lotes) {
  const dia = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const codigoProducto = producto
    .split(" ")
    .map((palabra) => palabra[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const secuencia = String(
    lotes.filter((lote) =>
      lote.codigoLote.startsWith(`LT-${dia}-${codigoProducto}`),
    ).length + 1,
  ).padStart(3, "0");
  return `LT-${dia}-${codigoProducto}-${secuencia}`;
}

export default function ClienteProduccion({ lotesIniciales, productos }) {
  const [lotes, establecerLotes] = useState(lotesIniciales);
  const [formulario, establecerFormulario] = useState({
    tina: "Tina 1",
    litrosLeche: "",
    producto: productos[0],
    kilosObtenidos: "",
    observaciones: "",
  });
  const [error, setError] = useState("");
  const [aviso, establecerAviso] = useState("");
  const litrosLeche = Number(formulario.litrosLeche);
  const kilos = Number(formulario.kilosObtenidos);
  const rendimientoEstimado =
    litrosLeche > 0 && kilos > 0
      ? ((kilos / litrosLeche) * 100).toFixed(2)
      : "-";

  function actualizarCampo(evento) {
    establecerFormulario((actual) => ({
      ...actual,
      [evento.target.name]: evento.target.value,
    }));
    setError("");
    establecerAviso("");
  }

  function gestionarEnvio(evento) {
    evento.preventDefault();
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
    if (formulario.observaciones.length > 45) {
      setError("Las observaciones no pueden superar los 45 caracteres.");
      return;
    }
    const nuevoLote = {
      codigoLote: crearCodigoLote(formulario.producto, lotes),
      tina: formulario.tina,
      fechaInicio: formatearFecha(new Date()),
      fechaFin: "-",
      producto: formulario.producto,
      litrosLeche,
      kilosObtenidos: kilos,
      rendimientoReal: null,
      estado: "En producción",
      observaciones: formulario.observaciones,
    };
    establecerLotes((actual) => [nuevoLote, ...actual]);
    establecerFormulario((actual) => ({
      ...actual,
      litrosLeche: "",
      kilosObtenidos: "",
      observaciones: "",
    }));
    establecerAviso(`Lote ${nuevoLote.codigoLote} iniciado correctamente.`);
  }

  function cerrarLote(codigo) {
    establecerLotes((actual) =>
      actual.map((lote) => {
        if (lote.codigoLote !== codigo || lote.estado !== "En producción")
          return lote;
        return {
          ...lote,
          fechaFin: formatearFecha(new Date()),
          rendimientoReal: (
            (lote.kilosObtenidos / lote.litrosLeche) *
            100
          ).toFixed(2),
          estado: "En maduración",
        };
      }),
    );
    establecerAviso(`El lote ${codigo} fue cerrado y pasó a maduración.`);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
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
      </header>
      <FormularioProduccion
        productos={productos}
        formulario={formulario}
        rendimientoEstimado={rendimientoEstimado}
        error={error}
        aviso={aviso}
        alCambiar={actualizarCampo}
        alEnviar={gestionarEnvio}
      />
      <TablaLotes lotes={lotes} alCerrarLote={cerrarLote} />
    </div>
  );
}
