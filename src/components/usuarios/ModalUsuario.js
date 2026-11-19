"use client";

import { useState } from "react";

const DEFAULT_DATA = {
    nombre: "",
    apellido: "",
    nombreUsuario: "",
    email: "",
    password: "",
    rol: "Operario",
    activo: true,
};

function ModalUsuarioContenido({ onClose, onSave, usuario }) {
    const [formData, setFormData] = useState(() =>
        usuario
            ? {
                  ...DEFAULT_DATA,
                  ...usuario,
                  password: "",
                  activo: Boolean(usuario.activo),
              }
            : DEFAULT_DATA
    );
    const [isSaving, setIsSaving] = useState(false);
    const [submitError, setSubmitError] = useState("");

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError("");
        setIsSaving(true);

        try {
            await onSave(formData);
            onClose();
        } catch (err) {
            setSubmitError(err?.message || "No se pudo guardar el usuario.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm transition-opacity p-4"
            onClick={() => !isSaving && onClose()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-usuario-titulo"
        >
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-gray-200 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h2 id="modal-usuario-titulo" className="text-lg font-bold text-blue-900">
                        {usuario ? "Configurar Usuario" : "Añadir Nuevo Usuario"}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
                        aria-label="Cerrar modal"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {submitError && (
                        <div
                            role="alert"
                            className="bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-3 text-sm font-medium"
                        >
                            {submitError}
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="usuario-nombre" className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre
                            </label>
                            <input
                                id="usuario-nombre"
                                type="text"
                                name="nombre"
                                value={formData.nombre || ""}
                                onChange={handleChange}
                                required
                                maxLength={50}
                                disabled={isSaving}
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 disabled:bg-gray-100"
                                placeholder="Ej: Juan"
                            />
                        </div>
                        <div>
                            <label htmlFor="usuario-apellido" className="block text-sm font-medium text-gray-700 mb-1">
                                Apellido
                            </label>
                            <input
                                id="usuario-apellido"
                                type="text"
                                name="apellido"
                                value={formData.apellido || ""}
                                onChange={handleChange}
                                required
                                maxLength={50}
                                disabled={isSaving}
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 disabled:bg-gray-100"
                                placeholder="Ej: Pérez"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="usuario-username" className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre de Usuario
                            </label>
                            <input
                                id="usuario-username"
                                type="text"
                                name="nombreUsuario"
                                value={formData.nombreUsuario || ""}
                                onChange={handleChange}
                                required
                                minLength={3}
                                maxLength={30}
                                disabled={isSaving}
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 disabled:bg-gray-100"
                                placeholder="Ej: jperez"
                            />
                        </div>
                        <div>
                            <label htmlFor="usuario-rol" className="block text-sm font-medium text-gray-700 mb-1">
                                Rol en el Sistema
                            </label>
                            <select
                                id="usuario-rol"
                                name="rol"
                                value={formData.rol || "Operario"}
                                onChange={handleChange}
                                disabled={isSaving}
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 disabled:bg-gray-100"
                            >
                                <option value="Administrador">Administrador</option>
                                <option value="Operario">Operario</option>
                                <option value="Vendedor">Vendedor</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="usuario-email" className="block text-sm font-medium text-gray-700 mb-1">
                            Correo Electrónico
                        </label>
                        <input
                            id="usuario-email"
                            type="email"
                            name="email"
                            value={formData.email || ""}
                            onChange={handleChange}
                            required
                            maxLength={100}
                            disabled={isSaving}
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 disabled:bg-gray-100"
                            placeholder="jperez@lactar.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="usuario-password" className="block text-sm font-medium text-gray-700 mb-1">
                            {usuario ? "Nueva Contraseña (Opcional)" : "Contraseña Provisoria"}
                        </label>
                        <input
                            id="usuario-password"
                            type="password"
                            name="password"
                            value={formData.password || ""}
                            onChange={handleChange}
                            required={!usuario}
                            minLength={6}
                            maxLength={100}
                            disabled={isSaving}
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 disabled:bg-gray-100"
                            placeholder={usuario ? "Dejar en blanco para no cambiar" : "Mínimo 6 caracteres"}
                        />
                    </div>

                    <div className="flex items-start space-x-2 pt-2">
                        <input
                            type="checkbox"
                            name="activo"
                            id="activo"
                            checked={Boolean(formData.activo)}
                            onChange={handleChange}
                            disabled={isSaving}
                            className="mt-0.5 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <label htmlFor="activo" className="text-sm font-medium text-gray-700 cursor-pointer">
                            Usuario Activo (permite el inicio de sesión; desmarcar aplica baja lógica)
                        </label>
                    </div>

                    <div className="border-t border-gray-200 mt-6 pt-4 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSaving}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-700 border border-transparent rounded-lg hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm disabled:opacity-50"
                        >
                            {isSaving ? "Guardando..." : "Guardar Usuario"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function ModalUsuario({ isOpen, onClose, onSave, usuario }) {
    if (!isOpen) return null;
    return (
        <ModalUsuarioContenido
            key={usuario?.idUsuario ?? "nuevo"}
            onClose={onClose}
            onSave={onSave}
            usuario={usuario}
        />
    );
}
