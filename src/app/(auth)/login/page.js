"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginUsuario } from "@/services/auth";

function getSafeRedirectPath(rawPath) {
    if (!rawPath || typeof rawPath !== "string") return "/";
    if (!rawPath.startsWith("/") || rawPath.startsWith("//") || rawPath.startsWith("/login")) {
        return "/";
    }
    return rawPath;
}

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [identificador, setIdentificador] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(true);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        setError("");
        setIsSubmitting(true);

        try {
            await loginUsuario({
                identificador: identificador.trim(),
                password,
                rememberMe,
            });
            const destino = getSafeRedirectPath(searchParams.get("redirect"));
            router.push(destino);
            router.refresh();
        } catch (err) {
            setError(err.message || "No se pudo iniciar sesión.");
            setIsSubmitting(false);
        }
    };

    return (
        <form className="space-y-5" onSubmit={handleLogin}>
            {error && (
                <div
                    role="alert"
                    className="bg-red-50 border border-red-200 text-red-800 rounded-md px-4 py-3 text-sm font-medium"
                >
                    {error}
                </div>
            )}

            <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Usuario o Correo Electrónico
                </label>
                <input
                    type="text"
                    id="username"
                    name="identificador"
                    autoComplete="username"
                    value={identificador}
                    onChange={(e) => setIdentificador(e.target.value)}
                    placeholder="Ej: admin o usuario@lactar.com"
                    disabled={isSubmitting}
                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    required
                />
            </div>

            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Contraseña
                </label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresá tu contraseña"
                    disabled={isSubmitting}
                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    required
                />
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <input
                        id="remember-me"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        disabled={isSubmitting}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                        Recordarme
                    </label>
                </div>
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 transition-colors disabled:opacity-60"
            >
                {isSubmitting ? "Verificando credenciales..." : "Ingresar al Sistema"}
            </button>
        </form>
    );
}

export default function LoginPage() {
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-100 p-4">
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

                <Suspense fallback={<div className="text-center text-sm text-gray-500 py-6">Cargando...</div>}>
                    <LoginForm />
                </Suspense>
            </div>
        </div>
    );
}
