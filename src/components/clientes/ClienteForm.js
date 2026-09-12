"use client";

import { useState } from 'react';

const emptyClient = { razonSocial: '', cuit: '', telefono: '', domicilio: '', email: '' };

export default function ClienteForm({ client, clients, onCancel, onSave }) {
    const [values, setValues] = useState(client || emptyClient);
    const [error, setError] = useState('');

    const handleChange = (event) => {
        setValues({ ...values, [event.target.name]: event.target.value });
        setError('');
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const normalizedCuit = values.cuit.replace(/-/g, '').trim();

        if (!/^\d{11}$/.test(normalizedCuit)) {
            setError('El CUIT debe contener exactamente 11 números.');
            return;
        }
        if (values.telefono && !/^\d+$/.test(values.telefono.trim())) {
            setError('El teléfono solo puede contener números.');
            return;
        }
        if (clients.some((item) => item.cuit === normalizedCuit && item.id !== values.id)) {
            setError('Ya existe un cliente registrado con ese CUIT.');
            return;
        }

        onSave({ ...values, cuit: normalizedCuit, estado: values.estado || 'Activo' });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Directorio</p>
                    <h3 className="mt-1 text-xl font-bold text-slate-950">{client ? 'Editar cliente' : 'Nuevo cliente'}</h3>
                    <p className="mt-1 text-sm text-slate-500">Los campos marcados con * son obligatorios.</p>
                </div>
                <button type="button" onClick={onCancel} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Cerrar formulario"><CloseIcon /></button>
            </div>
            <div className="space-y-5">
                <label className="block text-sm font-semibold text-slate-700">
                    <span className="mb-2 block tracking-[0.01em]">Razón social <span className="text-red-500">*</span></span>
                    <input name="razonSocial" value={values.razonSocial} onChange={handleChange} required className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 placeholder:text-slate-400" placeholder="Ej. Distribuidora Sur S.A." />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-semibold text-slate-700">
                        <span className="mb-2 block tracking-[0.01em]">CUIT <span className="text-red-500">*</span></span>
                        <input name="cuit" value={values.cuit} onChange={handleChange} required inputMode="numeric" className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 placeholder:text-slate-400" placeholder="30712345679" />
                    </label>
                    <label className="block text-sm font-semibold text-slate-700">
                        <span className="mb-2 block tracking-[0.01em]">Teléfono</span>
                        <input name="telefono" value={values.telefono} onChange={handleChange} inputMode="numeric" className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 placeholder:text-slate-400" placeholder="2214567890" />
                    </label>
                </div>
                <label className="block text-sm font-semibold text-slate-700">
                    <span className="mb-2 block tracking-[0.01em]">Domicilio</span>
                    <input name="domicilio" value={values.domicilio} onChange={handleChange} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 placeholder:text-slate-400" placeholder="Calle y número" />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                    <span className="mb-2 block tracking-[0.01em]">Correo electrónico</span>
                    <input name="email" type="email" value={values.email} onChange={handleChange} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 placeholder:text-slate-400" placeholder="contacto@empresa.com" />
                </label>
            </div>
            {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
            <div className="flex gap-3 border-t border-slate-200 pt-4">
                <button type="button" onClick={onCancel} className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancelar</button>
                <button type="submit" className="flex-1 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-700/20 hover:bg-blue-800">Guardar cliente</button>
            </div>
        </form>
    );
}

function CloseIcon() {
    return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18 18 6M6 6l12 12" /></svg>;
}