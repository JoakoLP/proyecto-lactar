"use client";

import { useMemo, useState } from 'react';
import CobranzaTable from '@/components/cobranzas/CobranzaTable';
import ValidarCobranzaForm from '@/components/cobranzas/ValidarCobranzaForm';

const paymentMethods = ['Transferencia', 'Efectivo', 'Cheque', 'Otro medio habilitado'];
const collectionStatuses = ['Pendiente de validación', 'Validada', 'Parcial', 'Con saldo a favor', 'No identificada', 'Rechazada'];
const clientOptions = ['Distribuidora Sur S.A.', 'Fiambrería El Sol', 'Supermercado Centro', 'Lácteos del Oeste', 'Cooperativa Oeste'];

const initialCollections = [
    { id: 1, numeroFactura: 'Factura #A-0012', cliente: 'Distribuidora Sur S.A.', medioPago: 'Transferencia', montoInformado: 450000, totalFactura: 450000, estado: 'Pendiente de validación' },
    { id: 2, numeroFactura: 'Factura #A-0013', cliente: 'Fiambrería El Sol', medioPago: 'Efectivo', montoInformado: 125500, totalFactura: 125500, estado: 'Validada', montoValidado: 125500 },
    { id: 3, numeroFactura: 'Factura #A-0014', cliente: 'Supermercado Centro', medioPago: 'Cheque', montoInformado: 80000, totalFactura: 150000, estado: 'Parcial', montoValidado: 80000 },
    { id: 4, numeroFactura: '', cliente: 'Lácteos del Oeste', medioPago: 'Transferencia', montoInformado: 50000, totalFactura: 0, estado: 'No identificada' },
    { id: 5, numeroFactura: 'Factura #A-0015', cliente: 'Cooperativa Oeste', medioPago: 'Transferencia', montoInformado: 170000, totalFactura: 150000, estado: 'Con saldo a favor', montoValidado: 170000 },
    { id: 6, numeroFactura: 'Factura #A-0016', cliente: 'Distribuidora Sur S.A.', medioPago: 'Cheque', montoInformado: 98000, totalFactura: 120000, estado: 'Rechazada', montoValidado: 98000 },
];

export default function CobranzasPage() {
    const [collections, setCollections] = useState(initialCollections);
    const [filter, setFilter] = useState('Todos');
    const [selectedCollection, setSelectedCollection] = useState(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [importedFileName, setImportedFileName] = useState('');
    const [newCollection, setNewCollection] = useState({
        cliente: clientOptions[0],
        numeroFactura: '',
        montoInformado: '',
        fecha: new Date().toISOString().slice(0, 10),
        medioPago: paymentMethods[0],
        observaciones: '',
        estado: 'Pendiente de validación',
    });

    const filteredCollections = useMemo(() => collections.filter((collection) => filter === 'Todos' || collection.estado === filter), [collections, filter]);
    const pendingCount = collections.filter((collection) => collection.estado === 'Pendiente de validación').length;
    const validatedCount = collections.filter((collection) => collection.estado === 'Validada').length;
    const favorCount = collections.filter((collection) => collection.estado === 'Con saldo a favor').length;
    const totalPending = collections.filter((collection) => collection.estado === 'Pendiente de validación').reduce((total, collection) => total + collection.montoInformado, 0);
    const totalFavor = collections.filter((collection) => collection.estado === 'Con saldo a favor').reduce((total, collection) => total + Math.max(0, (collection.montoValidado ?? collection.montoInformado) - collection.totalFactura), 0);

    const saveValidation = (updatedCollection) => {
        setCollections((current) => current.map((collection) => collection.id === updatedCollection.id ? updatedCollection : collection));
        setSelectedCollection(null);
    };

    const handleCreateCollection = (event) => {
        event.preventDefault();

        const amount = Number(newCollection.montoInformado);
        if (!newCollection.cliente || !newCollection.numeroFactura || !newCollection.fecha || !Number.isFinite(amount) || amount <= 0) {
            return;
        }

        const created = {
            id: Date.now(),
            numeroFactura: newCollection.numeroFactura,
            cliente: newCollection.cliente,
            medioPago: newCollection.medioPago,
            montoInformado: amount,
            totalFactura: amount,
            estado: newCollection.estado,
            observaciones: newCollection.observaciones,
            fecha: newCollection.fecha,
        };

        setCollections((current) => [created, ...current]);
        setIsCreateOpen(false);
        setNewCollection({
            cliente: clientOptions[0],
            numeroFactura: '',
            montoInformado: '',
            fecha: new Date().toISOString().slice(0, 10),
            medioPago: paymentMethods[0],
            observaciones: '',
            estado: 'Pendiente de validación',
        });
    };

    const handleImport = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            setImportedFileName(file.name);
        }
        event.target.value = '';
    };

    return (
        <div className="space-y-6">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-950">Cobranzas</h2>
                    <p className="mt-1 text-sm text-slate-500">Revisión y conciliación de pagos informados.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-within:ring-4 focus-within:ring-blue-100">
                        <input aria-label="Importar cobros desde Excel" type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
                        Importar Excel
                    </label>
                    <button type="button" onClick={() => setIsCreateOpen(true)} className="inline-flex items-center justify-center rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">+ Nueva cobranza</button>
                </div>
            </header>

            {importedFileName && (
                <div aria-live="polite" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    Archivo importado: <span className="font-semibold">{importedFileName}</span>
                </div>
            )}

            <div className="grid border-y border-slate-200 bg-white sm:grid-cols-4">
                <SummaryItem label="Pendientes" value={pendingCount} detail="por validar" />
                <SummaryItem label="Validadas" value={validatedCount} detail="completadas" />
                <SummaryItem label="Saldo a favor" value={favorCount} detail="casos" />
                <SummaryItem label="Monto pendiente" value={formatCurrency(totalPending)} detail="informado" />
            </div>

            {favorCount > 0 && (
                <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-800">
                    Hay <span className="font-bold">{favorCount}</span> cobranza(s) con saldo a favor por un total de <span className="font-bold">{formatCurrency(totalFavor)}</span>.
                </div>
            )}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div><h3 className="font-bold text-slate-950">Validación de cobranzas</h3><p className="mt-1 text-xs text-slate-500">{filteredCollections.length} resultados visibles</p></div>
                    <label className="block">
                        <span className="sr-only">Filtrar cobranzas por estado</span>
                        <select aria-label="Filtrar cobranzas por estado" value={filter} onChange={(event) => setFilter(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"><option>Todos</option><option>Pendiente de validación</option><option>Validada</option><option>Parcial</option><option>Con saldo a favor</option><option>No identificada</option><option>Rechazada</option></select>
                    </label>
                </div>
                <CobranzaTable collections={filteredCollections} onValidate={setSelectedCollection} />
            </section>

            {selectedCollection && <div className="fixed inset-0 z-30 flex justify-end bg-slate-950/30 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="cobranza-form-title"><aside className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl"><ValidarCobranzaForm collection={selectedCollection} onCancel={() => setSelectedCollection(null)} onSave={saveValidation} /></aside></div>}

            {isCreateOpen && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="new-cobranza-title">
                    <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Registro</p>
                                <h3 id="new-cobranza-title" className="mt-1 text-xl font-bold text-slate-950">Nueva cobranza</h3>
                            </div>
                            <button type="button" onClick={() => setIsCreateOpen(false)} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200" aria-label="Cerrar formulario"><CloseIcon /></button>
                        </div>

                        <form onSubmit={handleCreateCollection} className="mt-5 space-y-4" noValidate>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label htmlFor="clienteCobranza" className="block text-sm font-semibold text-slate-700">
                                    <span className="mb-2 block">Cliente</span>
                                    <select id="clienteCobranza" value={newCollection.cliente} onChange={(event) => setNewCollection((current) => ({ ...current, cliente: event.target.value }))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-100">
                                        {clientOptions.map((client) => <option key={client} value={client}>{client}</option>)}
                                    </select>
                                </label>
                                <label htmlFor="facturaCobranza" className="block text-sm font-semibold text-slate-700">
                                    <span className="mb-2 block">Factura asociada</span>
                                    <input id="facturaCobranza" value={newCollection.numeroFactura} onChange={(event) => setNewCollection((current) => ({ ...current, numeroFactura: event.target.value }))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-100" placeholder="Factura #A-0020" required />
                                </label>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <label htmlFor="montoCobranza" className="block text-sm font-semibold text-slate-700">
                                    <span className="mb-2 block">Monto</span>
                                    <input id="montoCobranza" type="number" min="0.01" step="0.01" value={newCollection.montoInformado} onChange={(event) => setNewCollection((current) => ({ ...current, montoInformado: event.target.value }))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-100" placeholder="150000" required />
                                </label>
                                <label htmlFor="fechaCobranza" className="block text-sm font-semibold text-slate-700">
                                    <span className="mb-2 block">Fecha</span>
                                    <input id="fechaCobranza" type="date" value={newCollection.fecha} onChange={(event) => setNewCollection((current) => ({ ...current, fecha: event.target.value }))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-100" required />
                                </label>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <label htmlFor="medioCobranza" className="block text-sm font-semibold text-slate-700">
                                    <span className="mb-2 block">Medio de pago</span>
                                    <select id="medioCobranza" value={newCollection.medioPago} onChange={(event) => setNewCollection((current) => ({ ...current, medioPago: event.target.value }))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-100">
                                        {paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}
                                    </select>
                                </label>
                                <label htmlFor="estadoCobranza" className="block text-sm font-semibold text-slate-700">
                                    <span className="mb-2 block">Estado</span>
                                    <select id="estadoCobranza" value={newCollection.estado} onChange={(event) => setNewCollection((current) => ({ ...current, estado: event.target.value }))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-100">
                                        {collectionStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                                    </select>
                                </label>
                            </div>

                            <label htmlFor="observacionesCobranza" className="block text-sm font-semibold text-slate-700">
                                <span className="mb-2 block">Observaciones</span>
                                <textarea id="observacionesCobranza" value={newCollection.observaciones} onChange={(event) => setNewCollection((current) => ({ ...current, observaciones: event.target.value }))} rows={4} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-100" placeholder="Detalle del pago, referencia, comentarios del vendedor..." />
                            </label>

                            <div className="flex gap-3 border-t border-slate-200 pt-4">
                                <button type="button" onClick={() => setIsCreateOpen(false)} className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200">Cancelar</button>
                                <button type="submit" className="flex-1 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-700/20 transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">Guardar cobranza</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function SummaryItem({ label, value, detail }) {
    return <div className="border-b border-slate-200 px-5 py-4 last:border-0 sm:border-r sm:last:border-r-0"><p className="text-xs font-semibold text-slate-500">{label}</p><div className="mt-1 flex items-baseline gap-2"><p className="text-xl font-bold text-slate-950">{value}</p><p className="text-xs text-slate-400">{detail}</p></div></div>;
}

function formatCurrency(value) { return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value); }
function CloseIcon() { return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18 18 6M6 6l12 12" /></svg>; }