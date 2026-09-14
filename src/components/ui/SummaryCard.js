export default function SummaryCard({ label, value, detail, icon, color }) {
    const iconColors = { 
        blue: 'bg-blue-50 text-blue-700', 
        green: 'bg-emerald-50 text-emerald-700', 
        amber: 'bg-amber-50 text-amber-700', 
        violet: 'bg-violet-50 text-violet-700' 
    };
    
    return (
        <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4 last:border-0 sm:border-r sm:last:border-r-0 xl:border-b-0">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconColors[color]}`}>
                {icon}
            </span>
            <div>
                <p className="text-xs font-semibold text-slate-500">{label}</p>
                <div className="mt-1 flex items-baseline gap-2">
                    <p className="text-xl font-bold text-slate-950">{value}</p>
                    <p className="text-xs text-slate-400">{detail}</p>
                </div>
            </div>
        </div>
    );
}

export function formatCurrency(value) { 
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value); 
}