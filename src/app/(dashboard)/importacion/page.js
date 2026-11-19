"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import ModalEstructura from "@/components/importacion/ModalEstructura";
import { importarArchivo } from "@/services/importacion";
import { validarEstructuraColumnas } from "@/utils/importacionValidation";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export default function ImportacionPage() {
    const [entidad, setEntidad] = useState("clientes");
    const [archivo, setArchivo] = useState(null);
    const [datosPreview, setDatosPreview] = useState([]);
    const [totalFilas, setTotalFilas] = useState(0);
    const [columnas, setColumnas] = useState([]);
    const [error, setError] = useState("");
    const [estructuraInvalida, setEstructuraInvalida] = useState(false);
    const [entidadSugerida, setEntidadSugerida] = useState(null);
    const [erroresValidacion, setErroresValidacion] = useState([]);
    const [resultadoImportacion, setResultadoImportacion] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isModalEstructuraOpen, setIsModalEstructuraOpen] = useState(false);

    const validarEncabezados = useCallback((entidadObjetivo, headersDetectados) => {
        const check = validarEstructuraColumnas(entidadObjetivo, headersDetectados);
        if (!check.ok) {
            setEstructuraInvalida(true);
            setEntidadSugerida(check.entidadDetectada || null);
            setError(check.error);
        } else {
            setEstructuraInvalida(false);
            setEntidadSugerida(null);
            setError("");
        }
    }, []);

    const parseCSV = useCallback(
        (file, entidadActual) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: "greedy",
                complete: (results) => {
                    if (results.errors.length > 0) {
                        setError("Hubo un error al leer el CSV.");
                        setEstructuraInvalida(true);
                        return;
                    }
                    const data = results.data ?? [];
                    if (data.length > 0) {
                        const headers = Object.keys(data[0]);
                        setColumnas(headers);
                        setTotalFilas(data.length);
                        setDatosPreview(data.slice(0, 5));
                        validarEncabezados(entidadActual, headers);
                    } else {
                        setError("El archivo CSV está vacío.");
                        setEstructuraInvalida(true);
                    }
                },
            });
        },
        [validarEncabezados]
    );

    const parseExcel = useCallback(
        (file, entidadActual) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: "array" });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

                    if (json.length > 0) {
                        const headers = Object.keys(json[0]);
                        setColumnas(headers);
                        setTotalFilas(json.length);
                        setDatosPreview(json.slice(0, 5));
                        validarEncabezados(entidadActual, headers);
                    } else {
                        setError("El archivo Excel está vacío.");
                        setEstructuraInvalida(true);
                    }
                } catch {
                    setError("No se pudo leer el archivo Excel. Asegúrate de que el formato sea correcto.");
                    setEstructuraInvalida(true);
                }
            };
            reader.readAsArrayBuffer(file);
        },
        [validarEncabezados]
    );

    const onDrop = useCallback(
        (acceptedFiles, rejectedFiles) => {
            setError("");
            setEstructuraInvalida(false);
            setEntidadSugerida(null);
            setErroresValidacion([]);
            setResultadoImportacion(null);
            setDatosPreview([]);
            setTotalFilas(0);
            setColumnas([]);

            if (rejectedFiles.length > 0) {
                const firstRejection = rejectedFiles[0];
                const tooLarge = firstRejection?.errors?.some((e) => e.code === "file-too-large");
                setError(
                    tooLarge
                        ? "El archivo supera el tamaño máximo permitido de 5 MB."
                        : "Archivo no soportado. Por favor, sube un archivo .csv, .xls o .xlsx."
                );
                return;
            }

            const file = acceptedFiles[0];
            if (!file) return;
            setArchivo(file);

            const lowerName = file.name.toLowerCase();
            if (lowerName.endsWith(".csv")) {
                parseCSV(file, entidad);
            } else if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
                parseExcel(file, entidad);
            } else {
                setError("Formato de archivo desconocido.");
                setEstructuraInvalida(true);
            }
        },
        [entidad, parseCSV, parseExcel]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "text/csv": [".csv"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
            "application/vnd.ms-excel": [".xls"],
        },
        maxFiles: 1,
        maxSize: MAX_FILE_SIZE_BYTES,
    });

    const handleLimpiar = () => {
        setArchivo(null);
        setDatosPreview([]);
        setTotalFilas(0);
        setColumnas([]);
        setError("");
        setEstructuraInvalida(false);
        setEntidadSugerida(null);
        setErroresValidacion([]);
    };

    const handleCambiarAEntidadSugerida = () => {
        if (!entidadSugerida) return;
        setEntidad(entidadSugerida);
        setErroresValidacion([]);
        validarEncabezados(entidadSugerida, columnas);
    };

    const handleImportar = async () => {
        if (!archivo || datosPreview.length === 0 || isUploading || estructuraInvalida) return;
        setIsUploading(true);
        setError("");
        setErroresValidacion([]);
        setResultadoImportacion(null);

        try {
            const res = await importarArchivo({ entidad, file: archivo });
            setResultadoImportacion(res);
            handleLimpiar();
        } catch (err) {
            setError(err.message || "No se pudo completar la importación.");
            if (err.details?.tipo === "estructura_invalida") {
                setEstructuraInvalida(true);
                setEntidadSugerida(err.details.entidadDetectada || null);
            } else if (Array.isArray(err.details?.errores)) {
                setErroresValidacion(err.details.errores);
            }
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-3 justify-between items-center border-b border-gray-200 pb-4">
                <h2 className="text-xl font-bold text-blue-900">
                    Importación Masiva de Datos
                </h2>
                <button
                    type="button"
                    onClick={() => setIsModalEstructuraOpen(true)}
                    className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded shadow-sm text-sm font-medium transition-colors flex items-center space-x-2"
                >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                    </svg>
                    <span>Ver Estructuras de Archivo</span>
                </button>
            </div>

            {/* Resultado exitoso */}
            {resultadoImportacion && (
                <div
                    role="status"
                    className="bg-green-50 border border-green-200 rounded-xl p-5 space-y-3"
                >
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-sm font-bold text-green-900">
                                {resultadoImportacion.message}
                            </p>
                            <p className="text-xs text-green-800 mt-1">
                                Filas procesadas: {resultadoImportacion.data.totalFilas} · Insertados:{" "}
                                <strong>{resultadoImportacion.data.insertados}</strong> · Omitidos (ya existentes):{" "}
                                <strong>{resultadoImportacion.data.omitidos}</strong>
                            </p>
                            {resultadoImportacion.data.usuariosConPasswordProvisoria > 0 && (
                                <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-2.5 py-1.5 mt-2">
                                    {resultadoImportacion.data.usuariosConPasswordProvisoria} usuario(s) no incluían contraseña en el archivo y recibieron una contraseña provisoria hasheada. Podés asignarles una nueva desde el módulo Usuarios.
                                </p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => setResultadoImportacion(null)}
                            className="text-green-700 hover:text-green-900 font-bold"
                            aria-label="Cerrar resumen de importación"
                        >
                            ✕
                        </button>
                    </div>

                    {resultadoImportacion.data.detallesOmitidos?.length > 0 && (
                        <div className="bg-white border border-green-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                            <p className="text-xs font-bold text-gray-700 mb-1.5">Registros omitidos:</p>
                            <ul className="text-xs text-gray-600 space-y-1">
                                {resultadoImportacion.data.detallesOmitidos.map((item, idx) => (
                                    <li key={idx}>
                                        <span className="font-mono font-semibold">Fila {item.fila}</span> ({item.identificador}): {item.motivo}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 space-y-6">
                    {/* Controles de Configuración */}
                    <div className="max-w-md">
                        <label htmlFor="entidad-importacion" className="block text-sm font-bold text-gray-700 mb-2">
                            Seleccionar Entidad a Importar
                        </label>
                        <select
                            id="entidad-importacion"
                            value={entidad}
                            onChange={(e) => {
                                setEntidad(e.target.value);
                                setResultadoImportacion(null);
                                handleLimpiar();
                            }}
                            disabled={isUploading}
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
                        >
                            <option value="clientes">Clientes</option>
                            <option value="usuarios">Usuarios</option>
                            <option value="productos">Productos</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-2">
                            Se verifica automáticamente que las columnas del archivo coincidan con el esquema de {entidad}.
                        </p>
                    </div>

                    {/* Zona Drag & Drop */}
                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
                            ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"}
                            ${archivo ? (estructuraInvalida ? "bg-red-50/40 border-red-300" : "bg-gray-50") : ""}
                        `}
                    >
                        <input {...getInputProps()} />

                        {!archivo ? (
                            <div className="flex flex-col items-center space-y-3">
                                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-lg font-medium text-gray-700">Arrastra tu archivo Excel o CSV aquí</p>
                                    <p className="text-sm text-gray-500 mt-1">O haz clic para buscar en tu computadora</p>
                                </div>
                                <div className="text-xs text-gray-500 mt-2 font-mono">.csv, .xls, .xlsx (Máximo 5MB)</div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center space-y-2">
                                <div
                                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                        estructuraInvalida
                                            ? "bg-red-100 text-red-600"
                                            : "bg-green-100 text-green-600"
                                    }`}
                                >
                                    {estructuraInvalida ? (
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path>
                                        </svg>
                                    ) : (
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                        </svg>
                                    )}
                                </div>
                                <p className="text-md font-bold text-gray-800">{archivo.name}</p>
                                <p className="text-xs text-gray-500">
                                    {(archivo.size / 1024).toFixed(2)} KB · {totalFilas} fila(s) detectada(s)
                                </p>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleLimpiar();
                                    }}
                                    disabled={isUploading}
                                    className="text-red-600 text-sm hover:underline mt-2 disabled:opacity-50"
                                >
                                    Quitar archivo
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mensaje de Error + Errores de validación por fila */}
                    {error && (
                        <div role="alert" className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md space-y-3">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="flex items-start flex-1 min-w-[240px]">
                                    <div className="flex-shrink-0 mt-0.5">
                                        <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-red-800 font-semibold">{error}</p>
                                    </div>
                                </div>

                                {entidadSugerida && (
                                    <button
                                        type="button"
                                        onClick={handleCambiarAEntidadSugerida}
                                        className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md shadow-sm transition-colors capitalize shrink-0"
                                    >
                                        Cambiar entidad a {entidadSugerida}
                                    </button>
                                )}
                            </div>

                            {erroresValidacion.length > 0 && (
                                <div className="bg-white border border-red-200 rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                                    <table className="min-w-full divide-y divide-red-100 text-left text-xs">
                                        <thead className="bg-red-50 text-red-900 font-bold">
                                            <tr>
                                                <th className="px-3 py-2 w-20">Fila</th>
                                                <th className="px-3 py-2 w-36">Campo</th>
                                                <th className="px-3 py-2">Detalle</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 text-gray-800">
                                            {erroresValidacion.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-3 py-2 font-mono font-semibold">{item.fila}</td>
                                                    <td className="px-3 py-2 font-mono text-red-700">{item.campo}</td>
                                                    <td className="px-3 py-2">{item.mensaje}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Vista Previa */}
                    {datosPreview.length > 0 && (
                        <div className="space-y-4 pt-4 border-t border-gray-200">
                            <div className="flex flex-wrap gap-2 justify-between items-center">
                                <h3 className="text-md font-bold text-gray-800">
                                    Vista Previa de Datos (Primeras {datosPreview.length} de {totalFilas} filas)
                                </h3>
                                <span
                                    className={`text-xs font-bold px-2.5 py-0.5 rounded ${
                                        estructuraInvalida
                                            ? "bg-red-100 text-red-800"
                                            : "bg-blue-100 text-blue-800"
                                    }`}
                                >
                                    Columnas detectadas: {columnas.length}
                                    {estructuraInvalida ? " (estructura incompatible)" : " (estructura válida)"}
                                </span>
                            </div>

                            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            {columnas.map((col, index) => (
                                                <th key={index} className="px-6 py-3 font-bold text-gray-600 uppercase tracking-wider">
                                                    {col}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {datosPreview.map((fila, rowIndex) => (
                                            <tr key={rowIndex} className="hover:bg-gray-50">
                                                {columnas.map((col, colIndex) => (
                                                    <td key={colIndex} className="px-6 py-3 text-gray-700 whitespace-nowrap">
                                                        {fila[col] !== undefined && String(fila[col]).trim() !== "" ? (
                                                            String(fila[col])
                                                        ) : (
                                                            <span className="text-gray-400 italic">Vacío</span>
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={handleImportar}
                                    disabled={isUploading || estructuraInvalida}
                                    className={`px-6 py-3 rounded-lg text-white font-medium shadow-sm flex items-center space-x-2 transition-all
                                        ${
                                            isUploading || estructuraInvalida
                                                ? "bg-gray-400 cursor-not-allowed"
                                                : "bg-blue-700 hover:bg-blue-800"
                                        }
                                    `}
                                >
                                    {isUploading && (
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    )}
                                    <span>
                                        {isUploading
                                            ? "Validando e Importando..."
                                            : estructuraInvalida
                                              ? "Corrige la estructura para importar"
                                              : "Confirmar Importación"}
                                    </span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Estructuras */}
            <ModalEstructura
                isOpen={isModalEstructuraOpen}
                onClose={() => setIsModalEstructuraOpen(false)}
                entidadActiva={entidad}
            />
        </div>
    );
}
