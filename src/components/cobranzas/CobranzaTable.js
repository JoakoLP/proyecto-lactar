"use client";

import CobranzaStatusBadge from './CobranzaStatusBadge';

export default function CobranzaTable({ collections, onValidate }) {
    if (!collections.length) return <div className="px-6 py-16 text-center text-sm text-slate-500">No se encontraron cobranzas con esos filtros.</div>;

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] uppercase tracking-[0.12em] text-slate-500"><tr><th className="px-6 py-4 font-bold">Venta</th><th className="px-6 py-4 font-bold">Medio</th><th className="px-6 py-4 text-right font-bold">Informado</th><th className="px-6 py-4 text-right font-bold">Factura</th><th className="px-6 py-4 font-bold">Observaciones</th><th className="px-6 py-4 font-bold">Estado</th><th className="px-6 py-4 text-right font-bold">Acción</th></tr></thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                    {collections.map((collection) => {
                        const favorAmount = collection.estado === 'Con saldo a favor' ? (collection.montoValidado ?? collection.montoInformado) - collection.totalFactura : 0;

                        return (
                            <tr key={collection.id} className="transition-colors hover:bg-blue-50/40">
                                <td className="px-6 py-4"><p className="font-bold text-slate-900">{collection.numeroFactura || 'Sin factura asociada'}</p><p className="mt-1 text-xs text-slate-500">{collection.cliente}</p></td>
                                <td className="px-6 py-4 text-slate-600">{collection.medioPago}</td>
                                <td className="px-6 py-4 text-right font-bold text-slate-900">{formatCurrency(collection.montoInformado)}</td>
                                <td className="px-6 py-4 text-right text-slate-600">{collection.totalFactura ? formatCurrency(collection.totalFactura) : '-'}</td>
                                <td className="px-6 py-4 text-slate-600">
                                    <p className="max-w-[220px] leading-5 text-slate-600">{collection.observaciones || 'Sin observaciones'}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col items-start gap-1">
                                        <CobranzaStatusBadge status={collection.estado} />
                                        {collection.estado === 'Con saldo a favor' && (
                                            <span className="text-[11px] font-semibold text-violet-700">A favor: {formatCurrency(favorAmount)}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">{collection.estado === 'Pendiente de validación' || collection.estado === 'Parcial' ? <button onClick={() => onValidate(collection)} className="rounded-lg px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100">Validar</button> : <span className="text-xs text-slate-400">Completado</span>}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

function formatCurrency(value) { return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value); }