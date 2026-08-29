export default function ModuloGenericoPage() {
    return (
        <div className="space-y-6">
            {/* Encabezado del módulo con título y botón de acción principal */}
            <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                <h2 className="text-xl font-bold text-lactarDark">
                    Nombre del Módulo
                </h2>
                <button className="bg-lactarBlue hover:bg-blue-800 text-white px-4 py-2 rounded shadow-sm text-sm font-medium transition-colors">
                    + Nueva Acción (Ej: Crear)
                </button>
            </div>

            {/* Contenedor principal para el contenido (Tablas, Formularios, etc.) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6">

                <p className="text-gray-500 text-sm">
                    El contenido de tu módulo va aquí. Podés reemplazar este texto por tus componentes
                    como <code className="bg-gray-100 px-1 rounded text-gray-700">{'<TablaLotes />'}</code> o <code className="bg-gray-100 px-1 rounded text-gray-700">{'<FormularioCliente />'}</code>.
                </p>

            </div>
        </div>
    );
}