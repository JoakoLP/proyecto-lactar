"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

const ESTRUCTURAS = {
    clientes: {
        titulo: "Estructura de Archivo: Clientes",
        descripcion:
            "Columnas alineadas con la tabla 'cliente' de Supabase. Los registros cuyo CUIT ya exista se omitirán automáticamente.",
        nombreBase: "plantilla_clientes",
        hojaExcel: "Clientes",
        filasEjemplo: [
            {
                razonSocial: "Lácteos del Sur S.A.",
                cuit: "30123456789",
                domicilio: "Av. Siempreviva 123 - Quilmes",
                telefono: "01145678901",
                email: "contacto@lacteosdelsur.com",
                activo: true,
                saldo: 0.0,
            },
        ],
        columnas: [
            { nombre: "razonSocial", tipo: "Texto (máx. 100)", requerido: true, ej: "Lácteos del Sur S.A." },
            { nombre: "cuit", tipo: "Numérico (11 dígitos, único)", requerido: true, ej: "30123456789" },
            { nombre: "domicilio", tipo: "Texto (máx. 120)", requerido: false, ej: "Av. Siempreviva 123, Quilmes" },
            { nombre: "telefono", tipo: "Numérico (máx. 20 dígitos)", requerido: false, ej: "01145678901" },
            { nombre: "email", tipo: "Texto (Email, máx. 100)", requerido: false, ej: "contacto@empresa.com" },
            { nombre: "activo", tipo: "true/false o 1/0 (default: true)", requerido: false, ej: "true" },
            { nombre: "saldo", tipo: "Decimal con punto (default: 0.00)", requerido: false, ej: "0.00" },
        ],
    },
    usuarios: {
        titulo: "Estructura de Archivo: Usuarios",
        descripcion:
            "Columnas alineadas con la tabla 'usuario'. Si no se incluye 'password', se genera una contraseña provisoria hasheada.",
        nombreBase: "plantilla_usuarios",
        hojaExcel: "Usuarios",
        filasEjemplo: [
            {
                nombreUsuario: "jperez",
                nombre: "Juan",
                apellido: "Perez",
                email: "jperez@lactar.com",
                rol: "Operario",
                password: "Lactar2026!",
                activo: true,
            },
        ],
        columnas: [
            { nombre: "nombreUsuario", tipo: "Texto (3-30 chars, único)", requerido: true, ej: "jperez" },
            { nombre: "nombre", tipo: "Texto (máx. 50)", requerido: true, ej: "Juan" },
            { nombre: "apellido", tipo: "Texto (máx. 50)", requerido: true, ej: "Perez" },
            { nombre: "email", tipo: "Texto (Email, único)", requerido: true, ej: "jperez@lactar.com" },
            { nombre: "rol", tipo: "Administrador / Operario / Vendedor", requerido: true, ej: "Operario" },
            { nombre: "password", tipo: "Texto (mín. 6 caracteres)", requerido: false, ej: "Lactar2026!" },
            { nombre: "activo", tipo: "true/false o 1/0 (default: true)", requerido: false, ej: "true" },
        ],
    },
    productos: {
        titulo: "Estructura de Archivo: Productos",
        descripcion:
            "Columnas alineadas con la tabla 'producto'. Los productos con nombre ya existente se omitirán automáticamente.",
        nombreBase: "plantilla_productos",
        hojaExcel: "Productos",
        filasEjemplo: [
            {
                nombre: "Provolone Hilado",
                rendimientoEsperado: 9.2,
                tiempoMaduracion: 45,
                precioBase: 9800.0,
            },
        ],
        columnas: [
            { nombre: "nombre", tipo: "Texto (máx. 50, único)", requerido: true, ej: "Provolone Hilado" },
            { nombre: "rendimientoEsperado", tipo: "Decimal % (separador punto)", requerido: false, ej: "9.2" },
            { nombre: "tiempoMaduracion", tipo: "Entero (días, default: 0)", requerido: false, ej: "45" },
            { nombre: "precioBase", tipo: "Decimal por kg (separador punto)", requerido: true, ej: "9800.00" },
        ],
    },
};

function autoFitColumns(rows) {
    if (!rows.length) return [];
    const headers = Object.keys(rows[0]);
    return headers.map((header) => {
        const maxLen = Math.max(
            header.length,
            ...rows.map((row) => String(row[header] ?? "").length)
        );
        return { wch: Math.min(45, Math.max(16, maxLen + 5)) };
    });
}

function ModalEstructuraContenido({ onClose, entidadActiva }) {
    const [entidadSeleccionada, setEntidadSeleccionada] = useState(entidadActiva);

    const info = ESTRUCTURAS[entidadSeleccionada];

    const handleDescargarExcel = () => {
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(info.filasEjemplo);
        worksheet["!cols"] = autoFitColumns(info.filasEjemplo);
        XLSX.utils.book_append_sheet(workbook, worksheet, info.hojaExcel);
        XLSX.writeFile(workbook, `${info.nombreBase}.xlsx`);
    };

    const handleDescargarCSV = () => {
        const headers = Object.keys(info.filasEjemplo[0]);
        const values = headers.map((h) => String(info.filasEjemplo[0][h] ?? ""));
        const csvContent = "\uFEFF" + headers.join(",") + "\n" + values.join(",") + "\n";
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${info.nombreBase}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm transition-opacity p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-estructura-titulo"
        >
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-3xl border border-gray-200 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h2 id="modal-estructura-titulo" className="text-lg font-bold text-blue-900">
                        Guía de Importación
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar guía de importación"
                        className="text-gray-500 hover:text-gray-700 transition-colors"
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
                                type="button"
                                key={key}
                                onClick={() => setEntidadSeleccionada(key)}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors capitalize ${
                                    entidadSeleccionada === key
                                        ? "bg-white text-blue-700 shadow-sm"
                                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-200"
                                }`}
                            >
                                {key}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex-1 min-w-[240px]">
                                <h3 className="text-lg font-bold text-gray-800">{info.titulo}</h3>
                                <p className="text-sm text-gray-600 mt-1">{info.descripcion}</p>
                            </div>
                            <div className="flex flex-wrap gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={handleDescargarExcel}
                                    className="px-3 py-2 text-xs font-semibold text-white bg-emerald-600 border border-emerald-700 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                                >
                                    Descargar plantilla Excel (.xlsx)
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDescargarCSV}
                                    className="px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                                >
                                    Descargar CSV
                                </button>
                            </div>
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
                                            <td className="px-4 py-3 text-gray-600 italic">&quot;{col.ej}&quot;</td>
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

export default function ModalEstructura({ isOpen, onClose, entidadActiva = "clientes" }) {
    if (!isOpen) return null;
    return <ModalEstructuraContenido key={entidadActiva} onClose={onClose} entidadActiva={entidadActiva} />;
}
