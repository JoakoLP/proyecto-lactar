// src/app/page.js
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-blue-900 mb-6">Resumen del Día</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Leche Procesada */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Leche Procesada Hoy</p>
            <p className="text-2xl font-bold text-gray-800">11.600 L</p>
          </div>
        </div>

        {/* Queso Obtenido */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Queso Obtenido Hoy</p>
            <p className="text-2xl font-bold text-gray-800">1.335 Kg</p>
          </div>
        </div>

        {/* Rinde Promedio */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Rinde Promedio</p>
            <p className="text-2xl font-bold text-gray-800">11.5 %</p>
          </div>
        </div>

        {/* Transferencias */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Transf. Pendientes</p>
            <p className="text-2xl font-bold text-gray-800">3</p>
          </div>
        </div>
      </div>
    </div>
  );
}