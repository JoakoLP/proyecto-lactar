"use client";

import { useState, useEffect, useCallback } from "react";
import ModalUsuario from "@/components/usuarios/ModalUsuario";
import {
    getUsuarios,
    createUsuario,
    updateUsuario,
    darDeBajaUsuario,
    toggleEstadoUsuario,
} from "@/services/usuarios";

export default function UsuariosPage() {
    const [usuarios, setUsuarios] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [feedback, setFeedback] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [usuarioEditando, setUsuarioEditando] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);

    const cargarUsuarios = useCallback(async () => {
        setIsLoading(true);
        setError("");
        try {
            const data = await getUsuarios();
            setUsuarios(data);
        } catch (err) {
            if (err.name === "AbortError") return;
            setError(err.message || "No se pudieron cargar los usuarios.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        let active = true;

        getUsuarios({ signal: controller.signal })
            .then((data) => {
                if (!active) return;
                setUsuarios(data);
                setError("");
            })
            .catch((err) => {
                if (!active || err.name === "AbortError") return;
                setError(err.message || "No se pudieron cargar los usuarios.");
            })
            .finally(() => {
                if (active) setIsLoading(false);
            });

        return () => {
            active = false;
            controller.abort();
        };
    }, []);

    const handleSaveUsuario = async (formData) => {
        setFeedback("");
        if (usuarioEditando?.idUsuario) {
            const actualizado = await updateUsuario(usuarioEditando.idUsuario, formData);
            setUsuarios((prev) =>
                prev.map((u) => (u.idUsuario === actualizado.idUsuario ? actualizado : u))
            );
            setFeedback(`Usuario "${actualizado.nombreUsuario}" actualizado correctamente.`);
        } else {
            const creado = await createUsuario(formData);
            setUsuarios((prev) => [...prev, creado]);
            setFeedback(`Usuario "${creado.nombreUsuario}" registrado correctamente.`);
        }
    };

    const handleToggleEstado = async (user) => {
        setError("");
        setFeedback("");
        setUpdatingId(user.idUsuario);
        try {
            const actualizado = user.activo
                ? await darDeBajaUsuario(user.idUsuario)
                : await toggleEstadoUsuario(user.idUsuario, true);

            setUsuarios((prev) =>
                prev.map((u) => (u.idUsuario === actualizado.idUsuario ? actualizado : u))
            );
            setFeedback(
                actualizado.activo
                    ? `Usuario "${actualizado.nombreUsuario}" reactivado.`
                    : `Usuario "${actualizado.nombreUsuario}" dado de baja lógicamente (Inactivo).`
            );
        } catch (err) {
            setError(err.message || "No se pudo cambiar el estado del usuario.");
        } finally {
            setUpdatingId(null);
        }
    };

    const handleOpenModal = (user = null) => {
        setUsuarioEditando(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setUsuarioEditando(null);
        setIsModalOpen(false);
    };

    const getRolBadge = (rol) => {
        switch (rol) {
            case "Administrador":
                return (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-bold">
                        Administrador
                    </span>
                );
            case "Operario":
                return (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-bold">
                        Operario
                    </span>
                );
            case "Vendedor":
                return (
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-bold">
                        Vendedor
                    </span>
                );
            default:
                return (
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-bold">
                        {rol || "Sin rol"}
                    </span>
                );
        }
    };

    const getEstadoBadge = (activo) => {
        if (activo) {
            return (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-bold">
                    Activo
                </span>
            );
        }
        return (
            <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs font-bold">
                Inactivo
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {error && (
                <div
                    role="alert"
                    className="bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 flex items-center justify-between gap-4 text-sm"
                >
                    <span className="font-medium">{error}</span>
                    <button
                        type="button"
                        onClick={() => cargarUsuarios()}
                        className="px-3 py-1 bg-white border border-red-300 rounded-md text-red-700 font-medium hover:bg-red-100 transition-colors shrink-0"
                    >
                        Reintentar
                    </button>
                </div>
            )}

            {feedback && (
                <div
                    role="status"
                    className="bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 flex items-center justify-between gap-4 text-sm"
                >
                    <span className="font-medium">{feedback}</span>
                    <button
                        type="button"
                        onClick={() => setFeedback("")}
                        className="text-green-700 hover:text-green-900 font-bold"
                        aria-label="Cerrar notificación"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Cabecera y tabla */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-wrap gap-3 justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold text-blue-900">Gestión de Accesos y Roles</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Las contraseñas se almacenan hasheadas y las bajas se aplican de forma lógica.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => handleOpenModal()}
                        className="bg-blue-700 text-white px-4 py-2 rounded shadow-sm text-sm font-medium hover:bg-blue-800 transition-colors"
                    >
                        + Añadir Usuario
                    </button>
                </div>

                {/* Tabla */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-100 text-gray-600 text-xs uppercase font-bold border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4">Nombre Completo</th>
                                <th className="px-6 py-4">Correo Electrónico</th>
                                <th className="px-6 py-4">Rol</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-sm">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                        Cargando usuarios...
                                    </td>
                                </tr>
                            ) : usuarios.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                        No hay usuarios registrados en la base de datos.
                                    </td>
                                </tr>
                            ) : (
                                usuarios.map((user) => (
                                    <tr key={user.idUsuario} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-mono font-bold text-gray-900">
                                            {user.nombreUsuario}
                                        </td>
                                        <td className="px-6 py-4 text-gray-900">
                                            {user.nombre} {user.apellido}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{user.email}</td>
                                        <td className="px-6 py-4">{getRolBadge(user.rol)}</td>
                                        <td className="px-6 py-4">{getEstadoBadge(user.activo)}</td>
                                        <td className="px-6 py-4 text-right space-x-3 whitespace-nowrap">
                                            <button
                                                type="button"
                                                onClick={() => handleOpenModal(user)}
                                                className="text-blue-700 font-medium hover:underline transition-all"
                                            >
                                                Configurar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleToggleEstado(user)}
                                                disabled={updatingId === user.idUsuario}
                                                className={`font-medium hover:underline transition-all disabled:opacity-50 ${
                                                    user.activo ? "text-red-600" : "text-green-700"
                                                }`}
                                            >
                                                {updatingId === user.idUsuario
                                                    ? "Actualizando..."
                                                    : user.activo
                                                      ? "Desactivar"
                                                      : "Reactivar"}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            <ModalUsuario
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveUsuario}
                usuario={usuarioEditando}
            />
        </div>
    );
}
