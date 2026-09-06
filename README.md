# Proyecto LACTAR - Sistema de Gestión Integral para Fábrica de Quesos

**Grupo:** 21

**Materia:** Seminario Integrador

## 👥 Integrantes del proyecto

- Esperanza Franco — 33082
- Moritán Victoria — 34576
- Takara Joaquín — 34372
- Véliz Rubén — 34716

## 📁 Repositorio de Actividades

Link al repositorio previo al comienzo del desarrollo del proyecto.

[Repositorio de actividades](https://github.com/vicmoritan/proyecto-lactar)

## 📖 Descripción del Proyecto

**Proyecto Lactar** es un sistema informático diseñado para digitalizar y centralizar la gestión operativa y comercial de una fábrica de quesos. Su eje central es el seguimiento de la producción por tina y la trazabilidad por lotes, reemplazando el uso de registros manuales y planillas dispersas para optimizar la toma de decisiones y el control de inventario.

## 🛠️ Stack Tecnológico

- **Frontend & Backend:** Next.js (App Router) - JavaScript
- **Estilos:** Tailwind CSS
- **Base de Datos:** PostgreSQL (alojada en Supabase)
- **Hosting/Despliegue:** Vercel
- **Control de Versiones:** Git / GitHub

## 📂 Estructura del Proyecto (Monorepo Fullstack)

El proyecto utiliza la arquitectura unificada de Next.js, donde el frontend y el backend conviven en el mismo ecosistema:

```text
proyecto-lactar/
├── docs/                 # Documentación, actividades, prototipos
├── AGENTS.md             # Instrucciones de contexto para IAs
├── README.md             # Documentación principal
├── public/               # Assets estáticos
├── src/
│   ├── app/              # App Router (Next.js)
│   │   ├── api/          # ⚙️ BACKEND: Endpoints y lógica de servidor (Route Handlers)
│   │   ├── (auth)/       # 💻 FRONTEND: Layout y vistas de autenticación
│   │   └── (dashboard)/  # 💻 FRONTEND: Layout principal y vistas del sistema
│   ├── components/       # Componentes UI reutilizables
│   ├── hooks/            # Custom hooks de React
│   ├── services/         # Funciones para consumir la API interna o Supabase
│   └── utils/            # Utilidades compartidas
├── .env.local            # Variables de entorno (Supabase keys, etc.)
├── tailwind.config.js    # Configuración de estilos y colores
└── package.json
```

## 👥 Módulos y División de Tareas

El desarrollo está dividido estratégicamente para asegurar la integración cruzada entre los integrantes del equipo:

| Responsable             | Módulo                               | Descripción                      | Realización |
| ----------------------- | ------------------------------------ | -------------------------------- | ----------- |
| **Esperanza Franco**    | 🏭 Producción + Trazabilidad         | Componentes de formularios       | 0%          |
| **Veliz Condori Ruben** | 📦 Stock + Pedidos/Ventas            | Tablas y filtros interactivos    | 30%         |
| **Moritan Victoria**    | 👥 Clientes + Cobranzas              | Validaciones y manejo de errores | 0%          |
| **Takara Joaquin**      | 📊 Usuarios + Reportes + Importación | Routing, permisos y layouts      | 0%          |

## 🚀 Fases de Desarrollo

El proyecto requiere una integración constante siguiendo este orden lógico:

1. **Fase 1 — Base (Trabajo conjunto):** Setup de Next.js, Supabase, Router, Layout, Componentes comunes, Login y Manejo de roles.
2. **Fase 2 — Módulos Base:** Producción y Clientes.
3. **Fase 3 — Nivel Intermedio:** Trazabilidad, Stock, Cobranzas y Usuarios.
4. **Fase 4 — Nivel Comercial:** Pedidos + Ventas. Requiere que Producción y Stock funcionen previamente.
5. **Fase 5 — Cierre:** Reportes + Importación Excel. Consumen los datos generados por el resto de los módulos.

## ♿ Requisitos Transversales

- **Accesibilidad (RNF18-RNF21):** El sistema debe apuntar al nivel de conformidad WCAG 2.2 AA. Es obligatorio garantizar la compatibilidad con lectores de pantalla, navegación fluida por teclado, soporte para modificación de tamaño de fuente y alertas visuales/escritas claras.
