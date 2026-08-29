"use client";

import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();

    const handleLogin = (e) => {
        e.preventDefault();
        // Aquí iría tu lógica real de validación contra el backend
        // Por ahora, simulamos el ingreso y redirigimos al dashboard
        router.push('/');
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-100">
            <div className="absolute inset-0 z-0 bg-blue-900 opacity-90"></div>
            <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay"></div>

            <div className="z-10 bg-white p-8 rounded-lg shadow-2xl w-full max-w-md border-t-8 border-[#facc15] transform transition-all">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <span className="text-[#facc15] font-bold text-3xl">L</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight">LACTAR</h1>
                    <p className="text-sm text-gray-500 mt-2">Sistema de Gestión Integral</p>
                </div>

                <form className="space-y-6" onSubmit={handleLogin}>
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700">Usuario o Correo</label>
                        <input
                            type="text"
                            id="username"
                            defaultValue="admin"
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña</label>
                        <input
                            type="password"
                            id="password"
                            defaultValue="123456"
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input id="remember-me" type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" defaultChecked />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900"> Recordarme </label>
                        </div>
                        <div className="text-sm">
                            <a href="#" className="font-medium text-blue-600 hover:text-blue-500"> ¿Olvidaste tu contraseña? </a>
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 transition-colors"
                    >
                        Ingresar al Sistema
                    </button>
                </form>
            </div>
        </div>
    );
}