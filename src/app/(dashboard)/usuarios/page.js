"use client";

import { useState, useEffect, useCallback } from "react";
import ModalUsuario from "@/components/usuarios/ModalUsuario";
import { getCurrentUser } from "@/services/auth";
import {
    getUsuarios,
    createUsuario,
    updateUsuario,
    deleteUsuario,
    toggleEstadoUsuario,
} from "@/services/usuarios";
import { isAdminRole } from "@/utils/permissions";

export default function UsuariosPage() {
    const [usuarios, setUsuarios] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [feedback, setFeedback] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [usuarioEditando, setUsuarioEditando] = useState(null);
    const [usuarioEliminando, setUsuarioEliminando] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const cargarUsuarios = useCallback(async () => {
        setIsLoading(true);
        setError("");
        try {
            const [lista, me] = await Promise.all([getUsuarios(), getCurrentUser()]);
            setUsuarios(lista);
            setCurrentUser(me);
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

        Promise.all([
            getUsuarios({ signal: controller.signal }),
            getCurrentUser({ signal: controller.signal }).catch(() => null),
        ])
            .then(([lista, me]) => {
                if (!active) return;
                setUsuarios(lista);
                setCurrentUser(me);
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
            const actualizado = await toggleEstadoUsuario(user.idUsuario, !user.activo);

            setUsuarios((prev) =>
                prev.map((u) => (u.idUsuario === actualizado.idUsuario ? actualizado : u))
            );
            setFeedback(
                actualizado.activo
                    ? `Usuario "${actualizado.nombreUsuario}" reactivado.`
                    : `Usuario "${actualizado.nombreUsuario}" desactivado (Inactivo).`
            );
        } catch (err) {
            setError(err.message || "No se pudo cambiar el estado del usuario.");
        } finally {
            setUpdatingId(null);
        }
    };

    const handleConfirmDelete = async () => {
        if (!usuarioEliminando || isDeleting) return;
        setIsDeleting(true);
        setError("");
        setFeedback("");

        try {
            await deleteUsuario(usuarioEliminando.idUsuario);
            setUsuarios((prev) =>
                prev.filter((u) => u.idUsuario !== usuarioEliminando.idUsuario)
            );
            setFeedback(
                `Usuario "${usuarioEliminando.nombreUsuario}" eliminado definitivamente.`
            );
            setUsuarioEliminando(null);
        } catch (err) {
            setError(err.message || "No se pudo eliminar el usuario.");
            setUsuarioEliminando(null);
        } finally {
            setIsDeleting(false);
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

    const puedeEliminar = isAdminRole(currentUser?.rol);

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
                            Solo usuarios activos pueden iniciar sesión. La cuenta maestra del sistema está protegida y no aparece en esta lista.
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
                                        No hay usuarios administrables registrados en la base de datos.
                                    </td>
                                </tr>
                            ) : (
                                usuarios.map((user) => {
                                    const esMiUsuario = currentUser?.idUsuario === user.idUsuario;
                                    return (
                                        <tr key={user.idUsuario} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-mono font-bold text-gray-900">
                                                {user.nombreUsuario}
                                                {esMiUsuario && (
                                                    <span className="ml-2 font-sans text-[11px] font-semibold px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">
                                                        Tu sesión
                                                    </span>
                                                )}
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
                                                    disabled={updatingId === user.idUsuario || esMiUsuario}
                                                    title={
                                                        esMiUsuario
                                                            ? "No podés desactivar tu propia sesión"
                                                            : undefined
                                                    }
                                                    className={`font-medium hover:underline transition-all disabled:opacity-40 disabled:no-underline ${
                                                        user.activo ? "text-amber-700" : "text-green-700"
                                                    }`}
                                                >
                                                    {updatingId === user.idUsuario
                                                        ? "Actualizando..."
                                                        : user.activo
                                                          ? "Desactivar"
                                                          : "Reactivar"}
                                                </button>
                                                {puedeEliminar && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setUsuarioEliminando(user)}
                                                        disabled={esMiUsuario}
                                                        title={
                                                            esMiUsuario
                                                                ? "No podés eliminar tu propia sesión"
                                                                : "Eliminar usuario (solo Administradores)"
                                                        }
                                                        className="text-red-600 font-medium hover:underline transition-all disabled:opacity-40 disabled:no-underline"
                                                    >
                                                        Eliminar
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Alta/Edición */}
            <ModalUsuario
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveUsuario}
                usuario={usuarioEditando}
            />

            {/* Modal Confirmación Eliminación (solo Administradores) */}
            {usuarioEliminando && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4"
                    onClick={() => !isDeleting && setUsuarioEliminando(null)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-eliminar-usuario-titulo"
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-200 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
                            <h3
                                id="modal-eliminar-usuario-titulo"
                                className="text-lg font-bold text-red-900"
                            >
                                Eliminar Usuario
                            </h3>
                        </div>
                        <div className="p-6 space-y-3 text-sm text-gray-700">
                            <p>
                                ¿Seguro que querés eliminar definitivamente al usuario{" "}
                                <strong className="font-mono text-gray-900">
                                    {usuarioEliminando.nombreUsuario}
                                </strong>{" "}
                                ({usuarioEliminando.nombre} {usuarioEliminando.apellido})?
                            </p>
                            <p className="text-xs text-gray-500">
                                Esta acción verifica tu rol de Administrador en el servidor. Si el usuario tiene lotes o cobranzas asociadas, se bloqueará la eliminación para preservar la trazabilidad y podrás desactivarlo en su lugar.
                            </p>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => setUsuarioEliminando(null)}
                                disabled={isDeleting}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                {isDeleting ? "Eliminando..." : "Confirmar Eliminación"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
