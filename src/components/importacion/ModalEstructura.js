"use client";

import { useState, useEffect } from "react";

const ESTRUCTURAS = {
    clientes: {
        titulo: "Estructura de Archivo: Clientes",
        descripcion: "El archivo CSV o Excel debe contener exactamente las siguientes columnas en la primera fila (encabezados).",
        columnas: [
            { nombre: "razonSocial", tipo: "Texto", requerido: true, ej: "Lácteos del Sur S.A." },
            { nombre: "cuit", tipo: "Numérico (sin guiones)", requerido: true, ej: "30123456789" },
            { nombre: "email", tipo: "Texto (Email)", requerido: true, ej: "contacto@empresa.com" },
            { nombre: "telefono", tipo: "Numérico", requerido: false, ej: "01145678901" },
            { nombre: "direccion", tipo: "Texto", requerido: false, ej: "Av. Falsa 123" },
            { nombre: "localidad", tipo: "Texto", requerido: false, ej: "Quilmes" },
            { nombre: "provincia", tipo: "Texto", requerido: false, ej: "Buenos Aires" },
            { nombre: "activo", tipo: "Booleano (true/false)", requerido: true, ej: "true" }
        ]
    },
    usuarios: {
        titulo: "Estructura de Archivo: Usuarios",
        descripcion: "El archivo CSV o Excel debe contener exactamente las siguientes columnas en la primera fila (encabezados).",
        columnas: [
            { nombre: "nombreUsuario", tipo: "Texto", requerido: true, ej: "jperez" },
            { nombre: "nombre", tipo: "Texto", requerido: true, ej: "Juan" },
            { nombre: "apellido", tipo: "Texto", requerido: true, ej: "Perez" },
            { nombre: "email", tipo: "Texto (Email)", requerido: true, ej: "jperez@lactar.com" },
            { nombre: "rol", tipo: "Texto (Administrador/Operario/Vendedor)", requerido: true, ej: "Operario" },
            { nombre: "activo", tipo: "Booleano (true/false)", requerido: true, ej: "true" }
        ]
    },
    productos: {
        titulo: "Estructura de Archivo: Productos",
        descripcion: "El archivo CSV o Excel debe contener exactamente las siguientes columnas en la primera fila (encabezados).",
        columnas: [
            { nombre: "nombre", tipo: "Texto", requerido: true, ej: "Queso Cremoso 1KG" },
            { nombre: "descripcion", tipo: "Texto", requerido: false, ej: "Queso de pasta blanda" },
            { nombre: "codigoBarras", tipo: "Numérico", requerido: true, ej: "7791234567890" },
            { nombre: "precioVenta", tipo: "Decimal (separador punto)", requerido: true, ej: "8500.50" },
            { nombre: "stockMinimo", tipo: "Entero", requerido: true, ej: "10" },
            { nombre: "activo", tipo: "Booleano (true/false)", requerido: true, ej: "true" }
        ]
    }
};

export default function ModalEstructura({ isOpen, onClose, entidadActiva = "clientes" }) {
    const [entidadSeleccionada, setEntidadSeleccionada] = useState(entidadActiva);

    // Sincroniza la entidad activa si cambia por fuera cuando se abre el modal
    useEffect(() => {
        if (isOpen) {
            setEntidadSeleccionada(entidadActiva);
        }
    }, [isOpen, entidadActiva]);

    if (!isOpen) return null;

    const info = ESTRUCTURAS[entidadSeleccionada];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm transition-opacity"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-3xl border border-gray-200 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-blue-900">Guía de Importación</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <div className="p-6">
                    {/* Tabs */}
                    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
                        {Object.keys(ESTRUCTURAS).map((key) => (
                            <button
                                key={key}
                                onClick={() => setEntidadSeleccionada(key)}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors capitalize ${entidadSeleccionada === key
                                        ? "bg-white text-blue-700 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                                    }`}
                            >
                                {key}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">{info.titulo}</h3>
                            <p className="text-sm text-gray-600 mt-1">{info.descripcion}</p>
                        </div>

                        <div className="overflow-x-auto border border-gray-200 rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 font-bold text-gray-700 uppercase tracking-wider w-1/4">Columna</th>
                                        <th className="px-4 py-3 font-bold text-gray-700 uppercase tracking-wider w-1/4">Tipo</th>
                                        <th className="px-4 py-3 font-bold text-gray-700 uppercase tracking-wider w-1/6">Requerido</th>
                                        <th className="px-4 py-3 font-bold text-gray-700 uppercase tracking-wider w-1/3">Ejemplo</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {info.columnas.map((col, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-mono font-medium text-gray-900">{col.nombre}</td>
                                            <td className="px-4 py-3 text-gray-600">{col.tipo}</td>
                                            <td className="px-4 py-3">
                                                {col.requerido ? (
                                                    <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 rounded">Sí</span>
                                                ) : (
                                                    <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2 py-0.5 rounded">No</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 italic">"{col.ej}"</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
