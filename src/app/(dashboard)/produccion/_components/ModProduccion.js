"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createProduccion,
  getProducciones,
  getTinas,
} from "@/services/produccion";
import { getProductos } from "@/services/productos";
import FormularioProduccion from "./FormularioProduccion";
import ModalGestionLote from "./ModalGestionLote";
import TablaLotes from "./TablaLotes";
import TrazabilidadLote from "./TrazabilidadLote";

export default function ClienteProduccion() {
  const [tinas, setTinas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [lotes, setLotes] = useState([]);

  const [formulario, setFormulario] = useState({
    idTina: "",
    litrosLeche: "",
    idProducto: "",
    observaciones: "",
  });

  const [isLoadingCatalogos, setIsLoadingCatalogos] = useState(true);
  const [isLoadingLotes, setIsLoadingLotes] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  const [codigoTrazabilidad, setCodigoTrazabilidad] = useState(null);
  const [loteAGestionar, setLoteAGestionar] = useState(null);

  const cargarLotes = useCallback(async (signal) => {
    setIsLoadingLotes(true);
    try {
      const lista = await getProducciones({ signal });
      setLotes(lista);
    } catch (err) {
      if (err?.name !== "AbortError") {
        setError(
          err?.message || "No se pudieron cargar los lotes de producción.",
        );
      }
    } finally {
      setIsLoadingLotes(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function cargarDatosIniciales() {
      setIsLoadingCatalogos(true);
      setIsLoadingLotes(true);
      setError("");

      try {
        const [tinasData, productosData, lotesData] = await Promise.all([
          getTinas({ signal: controller.signal }),
          getProductos({ signal: controller.signal }),
          getProducciones({ signal: controller.signal }),
        ]);

        setTinas(tinasData);
        setProductos(productosData);
        setLotes(lotesData);

        setFormulario((actual) => ({
          ...actual,
          idTina: actual.idTina || String(tinasData[0]?.idTina ?? ""),
          idProducto:
            actual.idProducto || String(productosData[0]?.idProducto ?? ""),
        }));
      } catch (err) {
        if (err?.name !== "AbortError") {
          setError(
            err?.message ||
              "No se pudieron cargar los datos del módulo de producción.",
          );
        }
      } finally {
        setIsLoadingCatalogos(false);
        setIsLoadingLotes(false);
      }
    }

    cargarDatosIniciales();
    return () => controller.abort();
  }, []);

  function actualizarCampo(evento) {
    const { name, value } = evento.target;
    setFormulario((actual) => ({
      ...actual,
      [name]: value,
    }));
    setError("");
    setAviso("");
  }

  async function gestionarEnvio(evento) {
    evento.preventDefault();
    setError("");
    setAviso("");

    const idTina = Number(formulario.idTina);
    const idProducto = Number(formulario.idProducto);
    const litrosLeche = Number(formulario.litrosLeche);

    if (!Number.isInteger(idTina) || idTina <= 0) {
      setError("Seleccioná una tina válida.");
      return;
    }
    if (!Number.isInteger(idProducto) || idProducto <= 0) {
      setError("Seleccioná un producto válido.");
      return;
    }

    const tinaSeleccionada = tinas.find((t) => t.idTina === idTina);
    const capacidadMax = Number(tinaSeleccionada?.capacidadLitros ?? 5800);

    if (
      !Number.isFinite(litrosLeche) ||
      litrosLeche <= 0 ||
      litrosLeche > capacidadMax
    ) {
      setError(
        `La leche ingresada debe ser mayor a 0 y no superar ${capacidadMax.toLocaleString("es-AR")} litros.`,
      );
      return;
    }

    if (formulario.observaciones.trim().length > 255) {
      setError("Las observaciones no pueden superar los 255 caracteres.");
      return;
    }

    setIsSubmitting(true);
    try {
      const loteCreado = await createProduccion({
        idTina,
        idProducto,
        litrosLeche,
        observaciones: formulario.observaciones.trim() || null,
      });

      setFormulario((actual) => ({
        ...actual,
        litrosLeche: "",
        observaciones: "",
      }));
      setAviso(`Lote ${loteCreado.codigoLote} iniciado correctamente.`);
      await cargarLotes();
    } catch (err) {
      setError(err?.message || "No se pudo iniciar la producción.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function gestionarLoteActualizado(actualizado) {
    setAviso(
      `El lote ${actualizado.codigoLote} se actualizó al estado "${actualizado.estado_lote?.nombre ?? "actualizado"}".`,
    );
    await cargarLotes();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-lactarDark">
            Producción y Tinas
          </h2>
          <p className="text-sm text-gray-600">
            Iniciá lotes, controlá la producción y cerrá cada proceso con su
            rinde real.
          </p>
        </div>
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
          Capacidad máxima por tina: 5.800 L
        </span>
      </header>

      <FormularioProduccion
        tinas={tinas}
        productos={productos}
        formulario={formulario}
        isSubmitting={isSubmitting}
        isLoadingCatalogos={isLoadingCatalogos}
        error={error}
        aviso={aviso}
        alCambiar={actualizarCampo}
        alEnviar={gestionarEnvio}
      />

      <TablaLotes
        lotes={lotes}
        isLoading={isLoadingLotes}
        alVerTrazabilidad={(codigo) => setCodigoTrazabilidad(codigo)}
        alGestionarLote={(lote) => setLoteAGestionar(lote)}
      />

      <TrazabilidadLote
        isOpen={Boolean(codigoTrazabilidad)}
        codigoLote={codigoTrazabilidad}
        onClose={() => setCodigoTrazabilidad(null)}
      />

      <ModalGestionLote
        isOpen={Boolean(loteAGestionar)}
        lote={loteAGestionar}
        onClose={() => setLoteAGestionar(null)}
        onSaved={gestionarLoteActualizado}
      />
    </div>
  );
}
