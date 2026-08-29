import Link from 'next/link';
import '../globals.css';
import Sidebar from '@/components/layout/Sidebar';

export const metadata = {
  title: 'LACTAR - Sistema de Gestión',
  description: 'Sistema de Gestión Integral para Fábrica de Quesos - Grupo 21',
};

export default function DashboardLayout({ children }) {
  return (
    <html lang="es">
      <body className="bg-gray-50 text-gray-800 font-sans antialiased h-screen flex overflow-hidden">

        <Sidebar />

        <main className="flex-1 flex flex-col h-screen overflow-hidden bg-gray-50">
          <header className="bg-white shadow-sm px-8 py-4 flex justify-between items-center border-b border-gray-200 z-0">
            <h1 className="text-2xl font-bold text-blue-900">Sistema LACTAR</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500 font-medium">Seminario Integrador - Grupo 21</span>
              <Link href="/login" className="text-sm font-semibold text-red-600 hover:text-red-800 border border-red-200 rounded px-3 py-1 hover:bg-red-50 transition">
                Salir
              </Link>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-8 relative">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}