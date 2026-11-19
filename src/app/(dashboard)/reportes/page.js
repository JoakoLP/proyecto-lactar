"use client";

import { useState, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import { getReportes } from "@/services/reportes";

const PERIODOS = [
    { value: "30", label: "Últimos 30 días" },
    { value: "90", label: "Últimos 90 días" },
    { value: "365", label: "Último año" },
    { value: "all", label: "Todo el historial" },
];

const BAR_COLORS = [
    "bg-blue-500 hover:bg-blue-600",
    "bg-blue-600 hover:bg-blue-700",
    "bg-emerald-500 hover:bg-emerald-600",
    "bg-amber-500 hover:bg-amber-600",
    "bg-indigo-500 hover:bg-indigo-600",
    "bg-teal-500 hover:bg-teal-600",
];

const VARIEDAD_COLORS = [
    { bar: "bg-blue-600", text: "text-blue-700" },
    { bar: "bg-green-500", text: "text-green-700" },
    { bar: "bg-yellow-500", text: "text-yellow-700" },
    { bar: "bg-purple-500", text: "text-purple-700" },
    { bar: "bg-indigo-500", text: "text-indigo-700" },
    { bar: "bg-teal-500", text: "text-teal-700" },
];

function formatNumber(num) {
    return new Intl.NumberFormat("es-AR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(Number(num) || 0);
}

function formatCurrency(num) {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 2,
    }).format(Number(num) || 0);
}

export default function ReportesPage() {
    const [dias, setDias] = useState("30");
    const [reporte, setReporte] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [isExportingPdf, setIsExportingPdf] = useState(false);

    const cargarReportes = useCallback(async (periodoSeleccionado) => {
        setIsLoading(true);
        setError("");
        try {
            const data = await getReportes({ dias: periodoSeleccionado });
            setReporte(data);
        } catch (err) {
            if (err.name === "AbortError") return;
            setError(err.message || "No se pudieron obtener los reportes.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        let active = true;

        getReportes({ dias, signal: controller.signal })
            .then((data) => {
                if (!active) return;
                setReporte(data);
                setError("");
            })
            .catch((err) => {
                if (!active || err.name === "AbortError") return;
                setError(err.message || "No se pudieron obtener los reportes.");
            })
            .finally(() => {
                if (active) setIsLoading(false);
            });

        return () => {
            active = false;
            controller.abort();
        };
    }, [dias]);

    const handleChangeDias = (nuevoPeriodo) => {
        setIsLoading(true);
        setError("");
        setDias(nuevoPeriodo);
    };

    const autoFitSheet = (rows) => {
        const sheet = XLSX.utils.json_to_sheet(rows);
        if (rows.length > 0) {
            const headers = Object.keys(rows[0]);
            sheet["!cols"] = headers.map((header) => {
                const maxLen = Math.max(
                    header.length,
                    ...rows.map((row) => String(row[header] ?? "").length)
                );
                return { wch: Math.min(55, Math.max(16, maxLen + 6)) };
            });
        }
        return sheet;
    };

    const handleExportExcel = () => {
        if (!reporte) return;

        const workbook = XLSX.utils.book_new();
        const { kpis, periodo, rendimientoHistorico, produccionPorVariedad, ventasPorProducto, pedidosPorEstado } =
            reporte;

        const hojaResumen = autoFitSheet([
            { Indicador: "Período", Valor: periodo.etiqueta },
            { Indicador: "Kilos Producidos (kg)", Valor: kpis.totalKilosProducidos },
            { Indicador: "Litros Procesados (L)", Valor: kpis.totalLitrosProcesados },
            { Indicador: "Rendimiento Promedio (%)", Valor: kpis.rendimientoPromedio },
            { Indicador: "Cantidad de Lotes", Valor: kpis.cantidadLotes },
            { Indicador: "Stock Disponible Neto (kg)", Valor: kpis.stockDisponibleKg },
            { Indicador: "Ventas Confirmadas (cantidad)", Valor: kpis.ventasCantidad },
            { Indicador: "Ventas Confirmadas ($)", Valor: formatCurrency(kpis.ventasTotal) },
            { Indicador: "Cobranzas Validadas ($)", Valor: formatCurrency(kpis.cobranzasValidadasTotal) },
            { Indicador: "Pedidos Activos", Valor: kpis.pedidosActivos },
            { Indicador: "Clientes Activos", Valor: kpis.clientesActivos },
        ]);
        XLSX.utils.book_append_sheet(workbook, hojaResumen, "Resumen KPIs");

        const hojaRendimiento = autoFitSheet(
            rendimientoHistorico.length > 0
                ? rendimientoHistorico.map((r) => ({
                      Período: r.etiqueta,
                      "Rendimiento (%)": r.rendimientoPromedio,
                      "Kilos Obtenidos (kg)": r.kilosObtenidos,
                      "Litros de Leche (L)": r.litrosLeche,
                      "Cantidad de Lotes": r.cantidadLotes,
                  }))
                : [{ Mensaje: "Sin lotes registrados en el período" }]
        );
        XLSX.utils.book_append_sheet(workbook, hojaRendimiento, "Rendimiento");

        const hojaVariedad = autoFitSheet(
            produccionPorVariedad.length > 0
                ? produccionPorVariedad.map((v) => ({
                      Producto: v.producto,
                      "Kilos Obtenidos (kg)": v.kilosObtenidos,
                      "Litros Procesados (L)": v.litrosLeche,
                      "Participación (%)": v.porcentaje,
                      "Rendimiento (%)": v.rendimientoPromedio,
                      "Cantidad de Lotes": v.cantidadLotes,
                  }))
                : [{ Mensaje: "Sin producción registrada en el período" }]
        );
        XLSX.utils.book_append_sheet(workbook, hojaVariedad, "Producción por Variedad");

        const hojaComercial = autoFitSheet(
            ventasPorProducto.length > 0
                ? ventasPorProducto.map((v) => ({
                      Producto: v.producto,
                      "Kilos Vendidos (kg)": v.kilosVendidos,
                      "Total Facturado ($)": formatCurrency(v.totalVendido),
                  }))
                : [{ Mensaje: "Sin ventas confirmadas en el período" }]
        );
        XLSX.utils.book_append_sheet(workbook, hojaComercial, "Ventas por Producto");

        if (pedidosPorEstado.length > 0) {
            const hojaPedidos = autoFitSheet(
                pedidosPorEstado.map((p) => ({
                    Estado: p.estado,
                    Cantidad: p.cantidad,
                }))
            );
            XLSX.utils.book_append_sheet(workbook, hojaPedidos, "Pedidos por Estado");
        }

        const fechaStr = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(workbook, `reporte_lactar_${dias}d_${fechaStr}.xlsx`);
    };

    const handleExportPdf = async () => {
        if (!reporte || isExportingPdf) return;
        setIsExportingPdf(true);
        try {
            const { jsPDF } = await import("jspdf");
            const { default: autoTable } = await import("jspdf-autotable");

            const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
            const { kpis, periodo, rendimientoHistorico, produccionPorVariedad, ventasPorProducto, pedidosPorEstado } =
                reporte;

            // Encabezado institucional LACTAR
            doc.setFillColor(30, 58, 138); // lactarDark #1e3a8a
            doc.rect(0, 0, 210, 28, "F");
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text("LACTAR - Panel de Reportes Operativos y Comerciales", 14, 13);
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(
                `Período: ${periodo.etiqueta}  |  Emitido: ${new Date().toLocaleDateString("es-AR")}`,
                14,
                21
            );

            // Tabla 1: KPIs
            doc.setTextColor(30, 58, 138);
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Indicadores Clave", 14, 38);

            autoTable(doc, {
                startY: 42,
                head: [["Indicador", "Valor"]],
                body: [
                    ["Kilos Producidos", `${formatNumber(kpis.totalKilosProducidos)} kg (${kpis.cantidadLotes} lotes)`],
                    ["Litros de Leche Procesados", `${formatNumber(kpis.totalLitrosProcesados)} L`],
                    ["Rendimiento Promedio", `${formatNumber(kpis.rendimientoPromedio)} %`],
                    ["Stock Disponible Neto", `${formatNumber(kpis.stockDisponibleKg)} kg`],
                    ["Ventas Confirmadas", `${kpis.ventasCantidad} (${formatCurrency(kpis.ventasTotal)})`],
                    ["Cobranzas Validadas", formatCurrency(kpis.cobranzasValidadasTotal)],
                    ["Pedidos Activos / Clientes Activos", `${kpis.pedidosActivos} / ${kpis.clientesActivos}`],
                ],
                headStyles: { fillColor: [29, 78, 216] },
                styles: { fontSize: 9 },
            });

            // Tabla 2: Rendimiento Histórico
            const yRend = doc.lastAutoTable.finalY + 10;
            doc.setTextColor(30, 58, 138);
            doc.setFontSize(12);
            doc.text("Rendimiento Histórico", 14, yRend);

            autoTable(doc, {
                startY: yRend + 4,
                head: [["Período", "Lotes", "Litros (L)", "Kilos (kg)", "Rendimiento (%)"]],
                body:
                    rendimientoHistorico.length > 0
                        ? rendimientoHistorico.map((r) => [
                              r.etiqueta,
                              String(r.cantidadLotes),
                              formatNumber(r.litrosLeche),
                              formatNumber(r.kilosObtenidos),
                              `${formatNumber(r.rendimientoPromedio)}%`,
                          ])
                        : [["Sin datos en el período", "-", "-", "-", "-"]],
                headStyles: { fillColor: [29, 78, 216] },
                styles: { fontSize: 9 },
            });

            // Tabla 3: Producción por Variedad
            const yVar = doc.lastAutoTable.finalY + 10;
            doc.setTextColor(30, 58, 138);
            doc.setFontSize(12);
            doc.text("Producción por Variedad", 14, yVar);

            autoTable(doc, {
                startY: yVar + 4,
                head: [["Producto", "Lotes", "Kilos (kg)", "Participación", "Rinde Prom."]],
                body:
                    produccionPorVariedad.length > 0
                        ? produccionPorVariedad.map((v) => [
                              v.producto,
                              String(v.cantidadLotes),
                              formatNumber(v.kilosObtenidos),
                              `${formatNumber(v.porcentaje)}%`,
                              `${formatNumber(v.rendimientoPromedio)}%`,
                          ])
                        : [["Sin producción registrada en el período", "-", "-", "-", "-"]],
                headStyles: { fillColor: [29, 78, 216] },
                styles: { fontSize: 9 },
            });

            // Tabla 4: Ventas por Producto + Pedidos por Estado
            const yCom = doc.lastAutoTable.finalY + 10;
            doc.setTextColor(30, 58, 138);
            doc.setFontSize(12);
            doc.text("Resumen Comercial (Ventas por Producto)", 14, yCom);

            autoTable(doc, {
                startY: yCom + 4,
                head: [["Producto", "Kilos Vendidos", "Total Facturado"]],
                body:
                    ventasPorProducto.length > 0
                        ? ventasPorProducto.map((v) => [
                              v.producto,
                              `${formatNumber(v.kilosVendidos)} kg`,
                              formatCurrency(v.totalVendido),
                          ])
                        : [["Sin ventas confirmadas en el período", "-", "-"]],
                headStyles: { fillColor: [16, 185, 129] },
                styles: { fontSize: 9 },
            });

            if (pedidosPorEstado.length > 0) {
                const yPed = doc.lastAutoTable.finalY + 10;
                doc.setTextColor(30, 58, 138);
                doc.setFontSize(12);
                doc.text("Pedidos por Estado", 14, yPed);

                autoTable(doc, {
                    startY: yPed + 4,
                    head: [["Estado", "Cantidad"]],
                    body: pedidosPorEstado.map((p) => [p.estado, String(p.cantidad)]),
                    headStyles: { fillColor: [30, 58, 138] },
                    styles: { fontSize: 9 },
                });
            }

            const fechaStr = new Date().toISOString().slice(0, 10);
            doc.save(`reporte_lactar_${dias}d_${fechaStr}.pdf`);
        } catch (err) {
            setError(err?.message || "No se pudo generar el archivo PDF.");
        } finally {
            setIsExportingPdf(false);
        }
    };

    const kpis = reporte?.kpis;
    const rendimientoHistorico = reporte?.rendimientoHistorico ?? [];
    const produccionPorVariedad = reporte?.produccionPorVariedad ?? [];
    const ventasPorProducto = reporte?.ventasPorProducto ?? [];
    const pedidosPorEstado = reporte?.pedidosPorEstado ?? [];

    const maxRendimiento = Math.max(
        ...rendimientoHistorico.map((r) => r.rendimientoPromedio),
        1
    );
    const hayDatosRendimiento = rendimientoHistorico.some(
        (r) => r.cantidadLotes > 0 || r.rendimientoPromedio > 0
    );

    return (
        <div className="space-y-6">
            {/* Cabecera y controles */}
            <div className="flex flex-wrap gap-3 justify-between items-center border-b border-gray-200 pb-4">
                <div>
                    <h2 className="text-xl font-bold text-blue-900">Panel de Reportes</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Datos en tiempo real desde producción, stock, pedidos y ventas.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <label htmlFor="filtro-periodo" className="sr-only">
                        Filtrar período de reportes
                    </label>
                    <select
                        id="filtro-periodo"
                        value={dias}
                        onChange={(e) => handleChangeDias(e.target.value)}
                        disabled={isLoading}
                        className="bg-white border border-gray-300 text-gray-800 px-3 py-2 rounded shadow-sm text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        {PERIODOS.map((p) => (
                            <option key={p.value} value={p.value}>
                                {p.label}
                            </option>
                        ))}
                    </select>

                    <button
                        type="button"
                        onClick={handleExportExcel}
                        disabled={isLoading || !reporte}
                        className="bg-emerald-600 text-white px-4 py-2 rounded shadow-sm text-sm font-medium hover:bg-emerald-700 flex items-center space-x-2 transition-colors disabled:opacity-50"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <span>Exportar Excel</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleExportPdf}
                        disabled={isLoading || !reporte || isExportingPdf}
                        className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded shadow-sm text-sm font-medium hover:bg-gray-50 flex items-center space-x-2 transition-colors disabled:opacity-50"
                    >
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                        </svg>
                        <span>{isExportingPdf ? "Generando PDF..." : "Descargar PDF"}</span>
                    </button>
                </div>
            </div>

            {error && (
                <div
                    role="alert"
                    className="bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 flex items-center justify-between gap-4 text-sm"
                >
                    <span className="font-medium">{error}</span>
                    <button
                        type="button"
                        onClick={() => cargarReportes(dias)}
                        className="px-3 py-1 bg-white border border-red-300 rounded-md text-red-700 font-medium hover:bg-red-100 transition-colors shrink-0"
                    >
                        Reintentar
                    </button>
                </div>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                    <p className="text-xs font-bold uppercase text-gray-500">Producción ({reporte?.periodo?.etiqueta || "..."})</p>
                    <p className="text-2xl font-bold text-blue-900 mt-1">
                        {isLoading ? "..." : `${formatNumber(kpis?.totalKilosProducidos)} kg`}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        {isLoading
                            ? "Calculando..."
                            : `${kpis?.cantidadLotes ?? 0} lote(s) · ${formatNumber(kpis?.totalLitrosProcesados)} L`}
                    </p>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                    <p className="text-xs font-bold uppercase text-gray-500">Rendimiento Promedio</p>
                    <p className="text-2xl font-bold text-emerald-700 mt-1">
                        {isLoading ? "..." : `${formatNumber(kpis?.rendimientoPromedio)}%`}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Relación kg obtenidos / litros leche</p>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                    <p className="text-xs font-bold uppercase text-gray-500">Stock Disponible Neto</p>
                    <p className="text-2xl font-bold text-blue-700 mt-1">
                        {isLoading ? "..." : `${formatNumber(kpis?.stockDisponibleKg)} kg`}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        {isLoading ? "..." : `${kpis?.pedidosActivos ?? 0} pedido(s) activo(s) con reserva`}
                    </p>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                    <p className="text-xs font-bold uppercase text-gray-500">Ventas Confirmadas</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                        {isLoading ? "..." : formatCurrency(kpis?.ventasTotal)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        {isLoading
                            ? "..."
                            : `${kpis?.ventasCantidad ?? 0} venta(s) · Cobranzas validadas: ${formatCurrency(kpis?.cobranzasValidadasTotal)}`}
                    </p>
                </div>
            </div>

            {/* Gráficos principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Rendimiento Histórico */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-blue-900 mb-4">
                        Rendimiento Histórico ({reporte?.periodo?.etiqueta || "Últimos 30 días"})
                    </h3>

                    {isLoading ? (
                        <div className="h-44 flex items-center justify-center text-sm text-gray-500">
                            Cargando datos de rendimiento...
                        </div>
                    ) : !hayDatosRendimiento ? (
                        <div className="h-44 flex flex-col items-center justify-center text-center text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg p-4">
                            <p className="font-medium text-gray-700">Sin lotes registrados en este período</p>
                            <p className="text-xs mt-1">
                                Cuando se carguen lotes en producción, el rendimiento por período aparecerá aquí.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-end space-x-2 h-44 border-b border-l border-gray-200 p-2">
                                {rendimientoHistorico.map((item, idx) => {
                                    const pctHeight =
                                        item.rendimientoPromedio > 0
                                            ? Math.max(15, Math.round((item.rendimientoPromedio / maxRendimiento) * 100))
                                            : 4;
                                    const colorClass = BAR_COLORS[idx % BAR_COLORS.length];

                                    return (
                                        <div
                                            key={item.etiqueta}
                                            className="flex-1 h-full flex items-end"
                                        >
                                            <div
                                                className={`w-full ${colorClass} transition-all rounded-t flex justify-center items-end text-white text-xs font-bold pb-1 cursor-pointer`}
                                                style={{ height: `${pctHeight}%` }}
                                                title={`${item.etiqueta}: ${item.rendimientoPromedio}% (${item.kilosObtenidos} kg / ${item.litrosLeche} L en ${item.cantidadLotes} lote/s)`}
                                            >
                                                {item.rendimientoPromedio > 0 ? `${item.rendimientoPromedio}%` : ""}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex justify-between mt-2 text-xs text-gray-600 font-medium px-2 gap-1">
                                {rendimientoHistorico.map((item) => (
                                    <span key={item.etiqueta} className="flex-1 text-center truncate">
                                        {item.etiqueta}
                                    </span>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Producción por Variedad */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-blue-900 mb-4">Producción por Variedad</h3>

                    {isLoading ? (
                        <div className="h-44 flex items-center justify-center text-sm text-gray-500">
                            Cargando producción por variedad...
                        </div>
                    ) : produccionPorVariedad.length === 0 ? (
                        <div className="h-44 flex flex-col items-center justify-center text-center text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg p-4">
                            <p className="font-medium text-gray-700">Sin producción registrada en este período</p>
                            <p className="text-xs mt-1">
                                Los porcentajes por variedad de queso se calculan automáticamente a partir de los lotes.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {produccionPorVariedad.slice(0, 6).map((item, idx) => {
                                const palette = VARIEDAD_COLORS[idx % VARIEDAD_COLORS.length];
                                return (
                                    <div key={item.producto}>
                                        <div className="flex justify-between text-sm font-medium mb-1 gap-2">
                                            <span className="text-gray-800 truncate">
                                                {item.producto}{" "}
                                                <span className="text-xs text-gray-500 font-normal">
                                                    ({formatNumber(item.kilosObtenidos)} kg · {item.cantidadLotes} lote/s)
                                                </span>
                                            </span>
                                            <span className={`${palette.text} font-bold shrink-0`}>
                                                {formatNumber(item.porcentaje)}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div
                                                className={`${palette.bar} h-2.5 rounded-full transition-all`}
                                                style={{ width: `${Math.min(100, Math.max(2, item.porcentaje))}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Resumen comercial */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Ventas por producto */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-blue-900 mb-4">Ventas por Producto</h3>
                    {isLoading ? (
                        <p className="text-sm text-gray-500">Cargando ventas...</p>
                    ) : ventasPorProducto.length === 0 ? (
                        <p className="text-sm text-gray-500">
                            No hay ventas confirmadas en el período seleccionado.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-bold border-b border-gray-200">
                                    <tr>
                                        <th className="px-3 py-2">Producto</th>
                                        <th className="px-3 py-2 text-right">Kilos</th>
                                        <th className="px-3 py-2 text-right">Facturado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {ventasPorProducto.map((v) => (
                                        <tr key={v.producto}>
                                            <td className="px-3 py-2.5 font-medium text-gray-900">{v.producto}</td>
                                            <td className="px-3 py-2.5 text-right text-gray-700">
                                                {formatNumber(v.kilosVendidos)} kg
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-semibold text-gray-900">
                                                {formatCurrency(v.totalVendido)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pedidos por estado */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-blue-900">Pedidos por Estado</h3>
                        {!isLoading && (
                            <span className="text-xs font-medium text-gray-500">
                                Clientes activos: <strong className="text-gray-800">{kpis?.clientesActivos ?? 0}</strong>
                            </span>
                        )}
                    </div>
                    {isLoading ? (
                        <p className="text-sm text-gray-500">Cargando pedidos...</p>
                    ) : pedidosPorEstado.length === 0 ? (
                        <p className="text-sm text-gray-500">
                            No hay pedidos registrados en el período seleccionado.
                        </p>
                    ) : (
                        <div className="space-y-2.5">
                            {pedidosPorEstado.map((p) => (
                                <div
                                    key={p.estado}
                                    className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-sm"
                                >
                                    <span className="font-medium text-gray-800">{p.estado}</span>
                                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-xs">
                                        {p.cantidad}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
