const statusStyles = {
    'Pendiente de validación': 'bg-amber-50 text-amber-700 ring-amber-600/20',
    Validada: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    Parcial: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    'Con saldo a favor': 'bg-violet-50 text-violet-700 ring-violet-600/20',
    'No identificada': 'bg-slate-100 text-slate-600 ring-slate-500/20',
    Rechazada: 'bg-rose-50 text-rose-700 ring-rose-500/20',
    Anulada: 'bg-slate-200 text-slate-700 ring-slate-400/20',
};

export default function CobranzaStatusBadge({ status }) {
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[status] || statusStyles['No identificada']}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
            {status}
        </span>
    );
}