"use client";

import StatusBadge from './StatusBadge';

export default function ClienteTable({ clients, onEdit }) {
    if (!clients.length) return <div className="px-6 py-16 text-center text-sm text-slate-500">No se encontraron clientes con esos filtros.</div>;

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] uppercase tracking-[0.12em] text-slate-500"><tr><th className="px-6 py-4 font-bold">Cliente</th><th className="px-6 py-4 font-bold">CUIT</th><th className="px-6 py-4 font-bold">Contacto</th><th className="px-6 py-4 text-right font-bold">Saldo</th><th className="px-6 py-4 font-bold">Estado</th><th className="px-6 py-4 text-right font-bold">Acción</th></tr></thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                    {clients.map((client) => <tr key={client.id} className="group transition-colors hover:bg-blue-50/40">
                        <td className="px-6 py-4"><p className="font-bold text-slate-900">{client.razonSocial}</p><p className="mt-1 text-xs text-slate-500">{client.domicilio || 'Domicilio no informado'}</p></td>
                        <td className="px-6 py-4 font-mono text-sm font-semibold tracking-[0.05em] text-slate-700">{client.cuit}</td>
                        <td className="px-6 py-4"><p className="text-slate-700">{client.telefono || 'Sin teléfono'}</p><p className="mt-1 text-xs text-slate-400">{client.email || 'Sin correo'}</p></td>
                        <td className={`px-6 py-4 text-right font-bold ${client.saldo < 0 ? 'text-red-600' : client.saldo > 0 ? 'text-emerald-600' : 'text-slate-700'}`}>{formatCurrency(client.saldo)}</td>
                        <td className="px-6 py-4"><StatusBadge status={client.estado} /></td>
                        <td className="px-6 py-4 text-right"><button onClick={() => onEdit(client)} className="rounded-lg px-3 py-2 text-xs font-bold text-blue-700 opacity-80 hover:bg-blue-100 hover:opacity-100">Editar</button></td>
                    </tr>)}
                </tbody>
            </table>
        </div>
    );
}

function formatCurrency(value) { return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value); }