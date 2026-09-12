"use client";

import { useState } from 'react';

export default function ValidarCobranzaForm({ collection, onCancel, onSave }) {
    const [amount, setAmount] = useState(String(collection.montoValidado ?? collection.montoInformado));
    const [error, setError] = useState('');

    const validatedAmount = Number(amount);
    const difference = Number.isFinite(validatedAmount) ? validatedAmount - collection.totalFactura : null;
    const previewStatus = difference === null ? 'Sin validación' : difference < 0 ? 'Parcial' : difference > 0 ? 'Con saldo a favor' : 'Validada';

    const handleSubmit = (event) => {
        event.preventDefault();
        const validatedAmount = Number(amount);

        if (!Number.isFinite(validatedAmount) || validatedAmount <= 0) {
            setError('Ingresá un monto validado mayor a cero.');
            return;
        }

        const difference = validatedAmount - collection.totalFactura;
        const estado = difference < 0 ? 'Parcial' : difference > 0 ? 'Con saldo a favor' : 'Validada';
        onSave({ ...collection, montoValidado: validatedAmount, estado });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Conciliación</p>
                    <h3 className="mt-1 text-xl font-bold text-slate-950">Validar cobranza</h3>
                    <p className="mt-1 text-sm text-slate-500">{collection.numeroFactura || 'Sin factura asociada'} · {collection.cliente}</p>
                </div>
                <button type="button" onClick={onCancel} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Cerrar formulario"><CloseIcon /></button>
            </div>

            <dl className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm">
                <div>
                    <dt className="text-xs text-slate-500">Monto informado</dt>
                    <dd className="mt-1 font-bold text-slate-900">{formatCurrency(collection.montoInformado)}</dd>
                </div>
                <div>
                    <dt className="text-xs text-slate-500">Total factura</dt>
                    <dd className="mt-1 font-bold text-slate-900">{formatCurrency(collection.totalFactura)}</dd>
                </div>
            </dl>

            <label className="block text-sm font-semibold text-slate-700">
                <span className="mb-2 block tracking-[0.01em]">Monto validado <span className="text-red-500">*</span></span>
                <input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => { setAmount(event.target.value); setError(''); }} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 placeholder:text-slate-400" autoFocus />
            </label>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500">Estado sugerido:</span>
                    <span className={`font-semibold ${previewStatus === 'Validada' ? 'text-emerald-700' : previewStatus === 'Parcial' ? 'text-blue-700' : previewStatus === 'Con saldo a favor' ? 'text-violet-700' : 'text-slate-600'}`}>
                        {previewStatus}
                    </span>
                </div>
                {difference !== null && difference > 0 && (
                    <div className="mt-2 text-xs font-semibold text-violet-700">
                        Saldo a favor: {formatCurrency(difference)}
                    </div>
                )}
            </div>

            <p className="text-xs leading-5 text-slate-500">La conciliación compara el monto validado con el total de la factura para decidir si queda validada, parcial o con saldo a favor.</p>
            {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}

            <div className="flex gap-3 border-t border-slate-200 pt-4">
                <button type="button" onClick={onCancel} className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancelar</button>
                <button type="submit" className="flex-1 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-700/20 hover:bg-blue-800">Guardar validación</button>
            </div>
        </form>
    );
}

function formatCurrency(value) { return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value); }
function CloseIcon() { return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18 18 6M6 6l12 12" /></svg>; }