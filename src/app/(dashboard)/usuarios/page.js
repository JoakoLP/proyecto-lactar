"use client";

import { useState } from "react";
import ModalUsuario from "@/components/usuarios/ModalUsuario";

// Mock Data inicial
const usuariosIniciales = [
    {
        idUsuario: 1,
        nombreUsuario: "joaquin",
        nombre: "Joaquín",
        apellido: "Takara",
        email: "joaquin@lactar.com",
        rol: "Administrador",
        activo: true
    },
    {
        idUsuario: 2,
        nombreUsuario: "efranco",
        nombre: "Esperanza",
        apellido: "Franco",
        email: "franco@lactar.com",
        rol: "Operario",
        activo: true
    },
    {
        idUsuario: 3,
        nombreUsuario: "vmoritan",
        nombre: "Victoria",
        apellido: "Moritán",
        email: "victoria@lactar.com",
        rol: "Vendedor",
        activo: false
    },
    {
        idUsuario: 4,
        nombreUsuario: "rveliz",
        nombre: "Rubén",
        apellido: "Veliz",
        email: "ruben@lactar.com",
        rol: "Operario",
        activo: true
    }
];

export default function UsuariosPage() {
    const [usuarios, setUsuarios] = useState(usuariosIniciales);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [usuarioEditando, setUsuarioEditando] = useState(null);

    const handleSaveUsuario = (nuevoUsuario) => {
        if (nuevoUsuario.idUsuario) {
            // Edición
            setUsuarios(usuarios.map(u => u.idUsuario === nuevoUsuario.idUsuario ? nuevoUsuario : u));
        } else {
            // Creación
            const usuarioConId = {
                ...nuevoUsuario,
                idUsuario: usuarios.length > 0 ? Math.max(...usuarios.map(u => u.idUsuario)) + 1 : 1
            };
            setUsuarios([...usuarios, usuarioConId]);
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
                return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-bold">Administrador</span>;
            case "Operario":
                return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-bold">Operario</span>;
            case "Vendedor":
                return <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-bold">Vendedor</span>;
            default:
                return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-bold">{rol}</span>;
        }
    };

    const getEstadoBadge = (activo) => {
        if (activo) {
            return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-bold">Activo</span>;
        }
        return <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs font-bold">Inactivo</span>;
    };

    return (
        <div className="space-y-6">
            {/* Cabecera */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-blue-900">Gestión de Accesos y Roles</h2>
                    <button 
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
                                <th className="px-6 py-4 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-sm">
                            {usuarios.map((user) => (
                                <tr key={user.idUsuario} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-mono font-bold text-gray-900">{user.nombreUsuario}</td>
                                    <td className="px-6 py-4 text-gray-900">{user.nombre} {user.apellido}</td>
                                    <td className="px-6 py-4 text-gray-500">{user.email}</td>
                                    <td className="px-6 py-4">{getRolBadge(user.rol)}</td>
                                    <td className="px-6 py-4">{getEstadoBadge(user.activo)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => handleOpenModal(user)}
                                            className="text-blue-600 font-medium hover:underline transition-all"
                                        >
                                            Configurar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {usuarios.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                        No hay usuarios registrados.
                                    </td>
                                </tr>
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