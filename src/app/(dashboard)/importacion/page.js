"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import ModalEstructura from "@/components/importacion/ModalEstructura";

export default function ImportacionPage() {
    const [entidad, setEntidad] = useState("clientes");
    const [archivo, setArchivo] = useState(null);
    const [datosPreview, setDatosPreview] = useState([]);
    const [columnas, setColumnas] = useState([]);
    const [error, setError] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [isModalEstructuraOpen, setIsModalEstructuraOpen] = useState(false);

    // Manejo de la selección del archivo
    const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
        setError("");
        setDatosPreview([]);
        setColumnas([]);

        if (rejectedFiles.length > 0) {
            setError("Archivo no soportado. Por favor, sube un archivo .csv o .xlsx");
            return;
        }

        const file = acceptedFiles[0];
        setArchivo(file);

        if (file.name.endsWith(".csv")) {
            parseCSV(file);
        } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
            parseExcel(file);
        } else {
            setError("Formato de archivo desconocido.");
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls']
        },
        maxFiles: 1
    });

    const parseCSV = (file) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length > 0) {
                    setError("Hubo un error al leer el CSV.");
                    return;
                }
                const data = results.data;
                if (data.length > 0) {
                    setColumnas(Object.keys(data[0]));
                    setDatosPreview(data.slice(0, 5)); // Mostrar primeras 5 filas
                } else {
                    setError("El archivo CSV está vacío.");
                }
            }
        });
    };

    const parseExcel = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);

                if (json.length > 0) {
                    setColumnas(Object.keys(json[0]));
                    setDatosPreview(json.slice(0, 5)); // Mostrar primeras 5 filas
                } else {
                    setError("El archivo Excel está vacío.");
                }
            } catch (err) {
                setError("No se pudo leer el archivo Excel. Asegúrate de que el formato sea correcto.");
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleImportar = () => {
        if (!archivo || datosPreview.length === 0) return;
        setIsUploading(true);

        // Simulación de subida al servidor
        setTimeout(() => {
            setIsUploading(false);
            alert(`¡Importación de ${entidad} completada con éxito!`);
            handleLimpiar();
        }, 1500);
    };

    const handleLimpiar = () => {
        setArchivo(null);
        setDatosPreview([]);
        setColumnas([]);
        setError("");
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                <h2 className="text-xl font-bold text-blue-900">
                    Importación Masiva de Datos
                </h2>
                <button 
                    onClick={() => setIsModalEstructuraOpen(true)}
                    className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded shadow-sm text-sm font-medium transition-colors flex items-center space-x-2"
                >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                    </svg>
                    <span>Ver Estructuras de Archivo</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 space-y-6">

                    {/* Controles de Configuración */}
                    <div className="max-w-md">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Seleccionar Entidad a Importar
                        </label>
                        <select
                            value={entidad}
                            onChange={(e) => {
                                setEntidad(e.target.value);
                                handleLimpiar(); // Limpia el archivo si cambia la entidad
                            }}
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
                        >
                            <option value="clientes">Clientes</option>
                            <option value="usuarios">Usuarios</option>
                            <option value="productos">Productos</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-2">
                            Asegúrate de que el archivo coincida con la estructura requerida para {entidad}.
                        </p>
                    </div>

                    {/* Zona Drag & Drop */}
                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
                            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}
                            ${archivo ? 'bg-gray-50' : ''}
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
                                <div className="text-xs text-gray-400 mt-2 font-mono">.csv, .xls, .xlsx (Máximo 5MB)</div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center space-y-2">
                                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                </div>
                                <p className="text-md font-bold text-gray-800">{archivo.name}</p>
                                <p className="text-xs text-gray-500">{(archivo.size / 1024).toFixed(2)} KB</p>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleLimpiar(); }}
                                    className="text-red-500 text-sm hover:underline mt-2"
                                >
                                    Quitar archivo
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mensaje de Error */}
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-700 font-medium">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Vista Previa */}
                    {datosPreview.length > 0 && (
                        <div className="space-y-4 pt-4 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                                <h3 className="text-md font-bold text-gray-800">Vista Previa de Datos (Primeras 5 filas)</h3>
                                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded">
                                    Columnas detectadas: {columnas.length}
                                </span>
                            </div>

                            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            {columnas.map((col, index) => (
                                                <th key={index} className="px-6 py-3 font-bold text-gray-500 uppercase tracking-wider">
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
                                                        {fila[col] !== undefined ? String(fila[col]) : <span className="text-gray-300 italic">Vacio</span>}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={handleImportar}
                                    disabled={isUploading}
                                    className={`px-6 py-3 rounded-lg text-white font-medium shadow-sm flex items-center space-x-2 transition-all
                                        ${isUploading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-700 hover:bg-blue-800'}
                                    `}
                                >
                                    {isUploading && (
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    )}
                                    <span>{isUploading ? 'Procesando e Importando...' : 'Confirmar Importación'}</span>
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