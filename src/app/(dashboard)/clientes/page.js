"use client";

import { useMemo, useState } from 'react';
import ClienteForm from '@/components/clientes/ClienteForm';
import ClienteTable from '@/components/clientes/ClienteTable';
import SummaryCard, { formatCurrency } from '@/components/ui/SummaryCard';
import { PlusIcon, SearchIcon, UsersIcon, CheckIcon, AlertIcon, WalletIcon, CloseIcon } from '@/components/ui/Icons';

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
                <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800">
                    <PlusIcon /> Nuevo cliente
                </button>
            </header>

            <div className="grid border-y border-slate-200 bg-white sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard label="Registrados" value={clients.length} detail="clientes" icon={<UsersIcon />} color="blue" />
                <SummaryCard label="Activos" value={activeCount} detail="clientes" icon={<CheckIcon />} color="green" />
                <SummaryCard label="Con deuda" value={withBalance} detail="para revisar" icon={<AlertIcon />} color="amber" />
                <SummaryCard label="Saldo a favor" value={formatCurrency(positiveBalance)} detail="disponible" icon={<WalletIcon />} color="violet" />
            </div>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h3 className="font-bold text-slate-950">Directorio de clientes</h3>
                        <p className="mt-1 text-xs text-slate-500">{filteredClients.length} resultados visibles</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <label className="relative block">
                            <span className="sr-only">Buscar cliente</span>
                            <SearchIcon />
                            <input aria-label="Buscar cliente" value={search} onChange={(event) => setSearch(event.target.value)} className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 sm:w-64" placeholder="Buscar por nombre o CUIT" />
                        </label>
                        <label className="block">
                            <span className="sr-only">Filtrar clientes por estado</span>
                            <select aria-label="Filtrar clientes por estado" value={filter} onChange={(event) => setFilter(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                                <option>Todos</option>
                                <option>Activo</option>
                                <option>Inactivo</option>
                            </select>
                        </label>
                    </div>
                </div>
                <ClienteTable clients={filteredClients} onEdit={openEdit} onDelete={deleteClient} />
            </section>

            {isFormOpen && (
                <div className="fixed inset-0 z-30 flex justify-end bg-slate-950/30 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="cliente-form-title">
                    <aside className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl">
                        <ClienteForm client={editingClient} clients={clients} onCancel={() => setIsFormOpen(false)} onSave={saveClient} />
                    </aside>
                </div>
            )}

            {clientToDelete && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="delete-client-title">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-600">Confirmación</p>
                                <h3 id="delete-client-title" className="mt-2 text-xl font-bold text-slate-950">Eliminar cliente</h3>
                            </div>
                            <button type="button" onClick={() => setClientToDelete(null)} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200" aria-label="Cerrar confirmación"><CloseIcon /></button>
                        </div>

                        <p className="mt-4 text-sm leading-6 text-slate-600">
                            ¿Seguro que querés eliminar a <span className="font-bold text-slate-900">{clientToDelete.razonSocial}</span>? Esta acción no se puede deshacer desde esta vista.
                        </p>

                        <div className="mt-6 flex gap-3">
                            <button type="button" onClick={() => setClientToDelete(null)} className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200">Cancelar</button>
                            <button type="button" onClick={confirmDeleteClient} className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-red-600/20 transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200">Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}