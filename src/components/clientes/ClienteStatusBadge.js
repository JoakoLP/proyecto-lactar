const statusStyles = {
    Activo: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    Inactivo: 'bg-slate-100 text-slate-600 ring-slate-500/20',
};

export default function StatusBadge({ status }) {
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[status] || statusStyles.Inactivo}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
            {status}
        </span>
    );
}