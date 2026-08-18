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
* **Frontend:** React (JavaScript)
* **Estilos:** Tailwind CSS
* **Backend:** Node.js + Express
* **Base de Datos:** PostgreSQL
* **Control de Versiones:** Git / GitHub

## 📂 Estructura del Proyecto (Frontend)
El frontend utiliza App Router (Next.js) con una arquitectura modular enfocada en la reutilización de componentes y la separación de responsabilidades:

```text
src/
├── app/                  # App Router (Next.js)
│   ├── layout.js         # Layout raíz global
│   ├── page.js           # Página principal (Dashboard / Panel)
│   ├── login/
│   │   └── page.js       # Ruta /login
│   ├── produccion/
│   │   └── page.js       # Ruta /produccion
│   ├── stock/
│   │   └── page.js       # Ruta /stock
│   ├── pedidos/
│   │   └── page.js       # Ruta /pedidos
│   ├── clientes/
│   │   └── page.js       # Ruta /clientes
│   ├── cobranzas/
│   │   └── page.js       # Ruta /cobranzas
│   ├── reportes/
│   │   └── page.js       # Ruta /reportes
│   └── usuarios/
│       └── page.js       # Ruta /usuarios
├── components/           # Componentes comunes (Button, Modal, Table, Input, Badges)
├── services/             # Integración y llamadas a la API REST (Node.js)
├── hooks/                # Custom hooks de React
└── utils/                # Utilidades y funciones auxiliares

```


## 👥 Módulos y División de Tareas

El desarrollo está dividido estratégicamente para asegurar la integración cruzada entre los integrantes del equipo:

| Responsable | Módulo | Descripción |Realización |
| --- | --- | --- | --- |
| **Esperanza Franco** | 🏭 Producción + Trazabilidad | Componentes de formularios | 0% |
| **Veliz Condori Ruben** | 📦 Stock + Pedidos/Ventas | Tablas y filtros interactivos | 0% |
| **Moritan Victoria** | 👥 Clientes + Cobranzas | Validaciones y manejo de errores | 0% |
| **Takara Joaquin** | 📊 Usuarios + Reportes + Importación | Routing, permisos y layouts | 0% |






