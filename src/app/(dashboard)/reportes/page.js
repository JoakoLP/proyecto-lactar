export default function ReportesPage() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                <h2 className="text-xl font-bold text-blue-900">
                    Panel de Reportes
                </h2>
                <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded shadow-sm text-sm font-medium hover:bg-gray-50 flex items-center space-x-2 transition-colors">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                    </svg>
                    <span>Descargar PDF</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Rendimiento Histórico */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-blue-900 mb-4">
                        Rendimiento Histórico (Últimos 30 días)
                    </h3>
                    <div className="flex items-end space-x-2 h-40 border-b border-l border-gray-200 p-2">
                        <div className="w-1/4 bg-blue-400 hover:bg-blue-500 transition-colors rounded-t h-3/4 flex justify-center items-end text-white text-xs font-bold pb-1 cursor-pointer" title="Semana 1: 11.2%">
                            11.2%
                        </div>
                        <div className="w-1/4 bg-blue-500 hover:bg-blue-600 transition-colors rounded-t h-4/5 flex justify-center items-end text-white text-xs font-bold pb-1 cursor-pointer" title="Semana 2: 11.8%">
                            11.8%
                        </div>
                        <div className="w-1/4 bg-green-500 hover:bg-green-600 transition-colors rounded-t h-full flex justify-center items-end text-white text-xs font-bold pb-1 cursor-pointer" title="Semana 3: 12.5%">
                            12.5%
                        </div>
                        <div className="w-1/4 bg-yellow-400 hover:bg-yellow-500 transition-colors rounded-t h-2/3 flex justify-center items-end text-white text-xs font-bold pb-1 cursor-pointer" title="Semana 4: 10.5%">
                            10.5%
                        </div>
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500 font-medium px-2">
                        <span>Semana 1</span>
                        <span>Semana 2</span>
                        <span>Semana 3</span>
                        <span>Semana 4</span>
                    </div>
                </div>

                {/* Producción por Variedad */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-blue-900 mb-4">Producción por Variedad</h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm font-medium mb-1">
                                <span>Cremoso</span>
                                <span className="text-blue-600">55%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '55%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm font-medium mb-1">
                                <span>Sardo</span>
                                <span className="text-green-600">25%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '25%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm font-medium mb-1">
                                <span>Tybo</span>
                                <span className="text-yellow-500">12%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: '12%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm font-medium mb-1">
                                <span>Mozzarella</span>
                                <span className="text-purple-500">8%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: '8%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}