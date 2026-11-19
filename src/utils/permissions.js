export const ROLES = {
  ADMIN: "Administrador",
  OPERARIO: "Operario",
  VENDEDOR: "Vendedor",
};

export const ALL_ROLES = [ROLES.ADMIN, ROLES.OPERARIO, ROLES.VENDEDOR];

export const ROUTE_PERMISSIONS = [
  { path: "/produccion", roles: [ROLES.ADMIN, ROLES.OPERARIO] },
  { path: "/stock", roles: ALL_ROLES },
  { path: "/pedidos", roles: [ROLES.ADMIN, ROLES.VENDEDOR] },
  { path: "/clientes", roles: [ROLES.ADMIN, ROLES.VENDEDOR] },
  { path: "/cobranzas", roles: [ROLES.ADMIN, ROLES.VENDEDOR] },
  { path: "/reportes", roles: [ROLES.ADMIN] },
  { path: "/usuarios", roles: [ROLES.ADMIN] },
  { path: "/importacion", roles: [ROLES.ADMIN] },
  { path: "/", roles: ALL_ROLES },
];

export const API_PERMISSIONS = [
  { path: "/api/usuarios", roles: [ROLES.ADMIN] },
  { path: "/api/reportes", roles: [ROLES.ADMIN] },
  { path: "/api/importar", roles: [ROLES.ADMIN] },
  { path: "/api/produccion", roles: [ROLES.ADMIN, ROLES.OPERARIO] },
  { path: "/api/tinas", roles: [ROLES.ADMIN, ROLES.OPERARIO] },
  { path: "/api/lotes", roles: [ROLES.ADMIN, ROLES.OPERARIO] },
  { path: "/api/stock", roles: ALL_ROLES },
  { path: "/api/productos", roles: ALL_ROLES },
  { path: "/api/clientes", roles: [ROLES.ADMIN, ROLES.VENDEDOR] },
  { path: "/api/pedidos", roles: [ROLES.ADMIN, ROLES.VENDEDOR] },
  { path: "/api/ventas", roles: [ROLES.ADMIN, ROLES.VENDEDOR] },
  { path: "/api/cobranzas", roles: [ROLES.ADMIN, ROLES.VENDEDOR] },
];

export function canAccessRoute(rol, pathname) {
  if (!rol || !pathname) return false;
  if (rol === ROLES.ADMIN) return true;

  for (const rule of ROUTE_PERMISSIONS) {
    if (rule.path === "/") {
      if (pathname === "/") return rule.roles.includes(rol);
      continue;
    }
    if (pathname === rule.path || pathname.startsWith(`${rule.path}/`)) {
      return rule.roles.includes(rol);
    }
  }

  return false;
}

export function canAccessApi(rol, pathname) {
  if (!rol || !pathname) return false;
  if (rol === ROLES.ADMIN) return true;

  for (const rule of API_PERMISSIONS) {
    if (pathname === rule.path || pathname.startsWith(`${rule.path}/`)) {
      return rule.roles.includes(rol);
    }
  }

  // Cualquier otro endpoint no listado exige estar autenticado con rol válido
  return ALL_ROLES.includes(rol);
}

export function isAdminRole(rol) {
  return rol === ROLES.ADMIN;
}
