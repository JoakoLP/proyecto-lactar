"use client";

import { useMemo, useState } from 'react';
import ClienteForm from '@/components/clientes/ClienteForm';
import ClienteTable from '@/components/clientes/ClienteTable';

const initialClients = [
    { id: 1, razonSocial: 'Distribuidora Sur S.A.', cuit: '30712345679', telefono: '2214567890', domicilio: 'Calle 44 Nro 123', email: 'compras@distribuidorasur.com', saldo: -45000, estado: 'Activo' },
    { id: 2, razonSocial: 'Fiambrería El Sol', cuit: '20281234564', telefono: '1145678901', domicilio: 'Av. 7 Nro 456', email: 'administracion@elsol.com', saldo: 0, estado: 'Activo' },
    { id: 3, razonSocial: 'Supermercado Centro', cuit: '30887654321', telefono: '2219876543', domicilio: 'Calle 12 Nro 890', email: 'pagos@supercentro.com', saldo: 12500, estado: 'Activo' },
    { id: 4, razonSocial: 'Lácteos del Oeste', cuit: '30654321981', telefono: '', domicilio: 'Ruta 2 Km 58', email: '', saldo: 0, estado: 'Inactivo' },
];

export default function ClientesPage() {
    const [clients, setClients] = useState(initialClients);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('Todos');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [clientToDelete, setClientToDelete] = useState(null);

    const filteredClients = useMemo(() => clients.filter((client) => {
        const matchesSearch = `${client.razonSocial} ${client.cuit}`.toLowerCase().includes(search.toLowerCase());
        return matchesSearch && (filter === 'Todos' || client.estado === filter);
    }), [clients, search, filter]);

    const openCreate = () => { setEditingClient(null); setIsFormOpen(true); };
    const openEdit = (client) => { setEditingClient(client); setIsFormOpen(true); };
    const deleteClient = (clientId) => {
        const client = clients.find((item) => item.id === clientId);
        setClientToDelete(client || null);
    };

    const confirmDeleteClient = () => {
        if (!clientToDelete) return;
        setClients((current) => current.filter((client) => client.id !== clientToDelete.id));
        if (editingClient && editingClient.id === clientToDelete.id) setIsFormOpen(false);
        setClientToDelete(null);
    };
    const saveClient = (client) => {
        if (client.id) setClients((current) => current.map((item) => item.id === client.id ? client : item));
        else setClients((current) => [...current, { ...client, id: Date.now(), saldo: 0 }]);
        setIsFormOpen(false);
    };

    const activeCount = clients.filter((client) => client.estado === 'Activo').length;
    const withBalance = clients.filter((client) => client.saldo < 0).length;
    const positiveBalance = clients.filter((client) => client.saldo > 0).reduce((total, client) => total + client.saldo, 0);

    return (
        <div className="space-y-6">
            <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-950">Clientes</h2>
                    <p className="mt-1 text-sm text-slate-500">Altas, datos de contacto y saldos.</p>
                </div>
                <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"><PlusIcon /> Nuevo cliente</button>
            </header>

            <div className="grid border-y border-slate-200 bg-white sm:grid-cols-2 xl:grid-cols-4">
                <SummaryItem label="Registrados" value={clients.length} detail="clientes" icon={<UsersIcon />} color="blue" />
                <SummaryItem label="Activos" value={activeCount} detail="clientes" icon={<CheckIcon />} color="green" />
                <SummaryItem label="Con deuda" value={withBalance} detail="para revisar" icon={<AlertIcon />} color="amber" />
                <SummaryItem label="Saldo a favor" value={formatCurrency(positiveBalance)} detail="disponible" icon={<WalletIcon />} color="violet" />
            </div>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div><h3 className="font-bold text-slate-950">Directorio de clientes</h3><p className="mt-1 text-xs text-slate-500">{filteredClients.length} resultados visibles</p></div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <label className="relative block"><span className="sr-only">Buscar cliente</span><SearchIcon /><input value={search} onChange={(event) => setSearch(event.target.value)} className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 sm:w-64" placeholder="Buscar por nombre o CUIT" /></label>
                        <select value={filter} onChange={(event) => setFilter(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"><option>Todos</option><option>Activo</option><option>Inactivo</option></select>
                    </div>
                </div>
                <ClienteTable clients={filteredClients} onEdit={openEdit} onDelete={deleteClient} />
            </section>

            {isFormOpen && <div className="fixed inset-0 z-30 flex justify-end bg-slate-950/30 backdrop-blur-sm" role="dialog" aria-modal="true"><aside className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl"><ClienteForm client={editingClient} clients={clients} onCancel={() => setIsFormOpen(false)} onSave={saveClient} /></aside></div>}

            {clientToDelete && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 backdrop-blur-sm" role="dialog" aria-modal="true">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-600">Confirmación</p>
                                <h3 className="mt-2 text-xl font-bold text-slate-950">Eliminar cliente</h3>
                            </div>
                            <button type="button" onClick={() => setClientToDelete(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Cerrar confirmación"><CloseIcon /></button>
                        </div>

                        <p className="mt-4 text-sm leading-6 text-slate-600">
                            ¿Seguro que querés eliminar a <span className="font-bold text-slate-900">{clientToDelete.razonSocial}</span>? Esta acción no se puede deshacer desde esta vista.
                        </p>

                        <div className="mt-6 flex gap-3">
                            <button type="button" onClick={() => setClientToDelete(null)} className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancelar</button>
                            <button type="button" onClick={confirmDeleteClient} className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-red-600/20 hover:bg-red-700">Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SummaryItem({ label, value, detail, icon, color }) {
    const iconColors = { blue: 'bg-blue-50 text-blue-700', green: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700', violet: 'bg-violet-50 text-violet-700' };
    return <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4 last:border-0 sm:border-r sm:last:border-r-0 xl:border-b-0"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconColors[color]}`}>{icon}</span><div><p className="text-xs font-semibold text-slate-500">{label}</p><div className="mt-1 flex items-baseline gap-2"><p className="text-xl font-bold text-slate-950">{value}</p><p className="text-xs text-slate-400">{detail}</p></div></div></div>;
}

function formatCurrency(value) { return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value); }
const PlusIcon = () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeWidth="2" d="M12 5v14M5 12h14" /></svg>;
const SearchIcon = () => <svg className="absolute left-3 top-3 h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><circle cx="11" cy="11" r="7" strokeWidth="2" /><path strokeLinecap="round" strokeWidth="2" d="m20 20-4-4" /></svg>;
const UsersIcon = () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m8-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6 2a4 4 0 0 1 3 3.87V21m-3-10a4 4 0 0 0 0-8" /></svg>;
const CheckIcon = () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m5 12 4 4L19 6" /></svg>;
const AlertIcon = () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v4m0 4h.01M10.3 3.86 2.82 17a2 2 0 0 0 1.74 3h14.88a2 2 0 0 0 1.74-3L13.7 3.86a2 2 0 0 0-3.4 0Z" /></svg>;
const WalletIcon = () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7.5A2.5 2.5 0 0 1 5.5 5h13A2.5 2.5 0 0 1 21 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16.5v-9Z" /><path strokeLinecap="round" strokeWidth="2" d="M3 8h15m-1 5h.01" /></svg>;
const CloseIcon = () => <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18 18 6M6 6l12 12" /></svg>;
