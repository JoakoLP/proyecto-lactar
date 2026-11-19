"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { canAccessRoute } from "@/utils/permissions";

export default function Sidebar({ user }) {
  const pathname = usePathname();
  const rol = user?.rol || "";

  const mainItems = [
    { href: "/", label: "Panel General", icon: HomeIcon },
    { href: "/produccion", label: "Producción y Tinas", icon: FactoryIcon },
    { href: "/stock", label: "Stock y Lotes", icon: CubeIcon },
    { href: "/pedidos", label: "Pedidos y Ventas", icon: ShoppingCartIcon },
    { href: "/clientes", label: "Gestión de Clientes", icon: UsersIcon },
    { href: "/cobranzas", label: "Cobranzas", icon: CurrencyDollarIcon },
  ].filter((item) => canAccessRoute(rol, item.href));

  const adminItems = [
    { href: "/reportes", label: "Reportes", icon: ChartBarIcon },
    { href: "/usuarios", label: "Usuarios del Sistema", icon: UserGroupIcon },
    { href: "/importacion", label: "Importar Datos", icon: UploadIcon },
  ].filter((item) => canAccessRoute(rol, item.href));

  const nombreCompleto = user
    ? `${user.nombre || ""} ${user.apellido || ""}`.trim() || user.nombreUsuario
    : "Usuario";
  const inicial = (user?.nombre?.[0] || user?.nombreUsuario?.[0] || "U").toUpperCase();

  return (
    <aside className="w-64 bg-[#1e3a8a] text-white flex flex-col shadow-2xl z-10">
      {/* HEADER LOGO */}
      <div className="p-6 flex items-center space-x-3 border-b border-blue-800 bg-blue-950">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
          <span className="text-[#1e3a8a] font-bold text-xl">L</span>
        </div>
        <span className="text-2xl font-bold tracking-wide">
          LACTAR{" "}
          <span className="text-[#facc15] text-sm block -mt-1">Gestión</span>
        </span>
      </div>

      {/* MENÚ DE NAVEGACIÓN */}
      <nav className="flex-1 py-4 space-y-1 overflow-y-auto" aria-label="Menú principal">
        {mainItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            currentPath={pathname}
            label={item.label}
            icon={item.icon}
          />
        ))}

        {adminItems.length > 0 && (
          <>
            <div className="mt-4 mb-4 border-t border-blue-800"></div>
            {adminItems.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                currentPath={pathname}
                label={item.label}
                icon={item.icon}
              />
            ))}
          </>
        )}
      </nav>

      {/* PERFIL USUARIO */}
      <div className="p-4 border-t border-blue-800 bg-blue-950">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#facc15] rounded-full flex items-center justify-center text-blue-900 font-bold text-lg shadow shrink-0">
            {inicial}
          </div>
          <div className="text-sm min-w-0">
            <p className="text-white font-semibold truncate" title={nombreCompleto}>
              {nombreCompleto}
            </p>
            <p className="text-xs text-blue-300 truncate">
              {rol || "Sin rol"}
              {user?.esSistema ? " (Sistema)" : ""}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ href, currentPath, label, icon: Icon }) {
  const isActive = currentPath === href;

  return (
    <Link
      href={href}
      className={`w-full flex items-center space-x-3 px-6 py-3 font-medium transition-all duration-200 
        ${
          isActive
            ? "border-l-4 border-[#facc15] bg-blue-800 text-white"
            : "border-l-4 border-transparent text-blue-200 hover:bg-blue-800 hover:text-white"
        }`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </Link>
  );
}

const HomeIcon = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
    />
  </svg>
);
const FactoryIcon = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
    />
  </svg>
);
const CubeIcon = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
    />
  </svg>
);
const ShoppingCartIcon = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
    />
  </svg>
);
const UsersIcon = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
    />
  </svg>
);
const CurrencyDollarIcon = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08-.402-2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);
const ChartBarIcon = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
);
const UserGroupIcon = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);
const UploadIcon = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
    />
  </svg>
);
