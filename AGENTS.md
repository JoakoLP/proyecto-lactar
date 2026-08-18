# Contexto del Proyecto para Agentes de IA (Project LACTAR)

Este documento centraliza la lógica de negocio, arquitectura, reglas de diseño y estructura de datos del proyecto **LACTAR**. Debe ser utilizado como contexto (`context.md` o instrucción base) al interactuar con asistentes de código (ej. Cursor, GitHub Copilot) para reducir al máximo la incertidumbre en el desarrollo de los módulos.

---

## 1. Reglas Generales de Arquitectura y UI
* **Tecnologías Principales:** React (JavaScript), Tailwind CSS, Node.js/Express, PostgreSQL.
* **Diseño Visual (Tailwind):** Mantener la paleta de colores institucional del prototipo:
    ```javascript
    theme: {
      extend: {
        colors: {
          lactarDark: '#1e3a8a',
          lactarBlue: '#1d4ed8',
          lactarAccent: '#facc15',
          lactarGreen: '#10b981',
          lactarRed: '#ef4444'
        }
      }
    }
    ```
* **Estructura de Archivos:** Usar App Router (`src/app/[modulo]/page.js`). Componentes reutilizables en `src/components/`.
* **Accesibilidad:** Obligatorio cumplir con WCAG 2.2 AA (Navegación por Tab, aria-labels, contraste).

---

## 2. Catálogos y Datos Estáticos (Seeds)
Para evitar alucinaciones, la IA debe utilizar estrictamente estos valores predefinidos:
* **Productos (Quesos y Lácteos):** Cremoso, Tybo, Mozzarella en cilindro, Mozzarella en plancha, Pategras, Fontina, Sardo, Reggianito, Ricotta, Porsalut, Dulce de leche 10kg.
* **Tinas:** Tina 1 (Max 5.800 L), Tina 2 (Max 5.800 L).
* **Roles de Usuario:** Administrador, Operario, Vendedor.
* **Estados de Lote:** En producción, En maduración, Disponible, Reservado parcial, Reservado total, Agotado, Bloqueado, Cerrado.
* **Estados de Pedido:** Pendiente, En preparación, Preparado, Confirmado, Cancelado.
* **Estados de Cobranza:** Pendiente de validación, Validada, Parcial, Con saldo a favor, No identificada, Rechazada, Anulada.
* **Medios de Pago:** Transferencia, Efectivo, Cheque, Otro medio habilitado.

---

## 3. Contexto Específico por Módulo (Reglas de Negocio)

### 🏭 Módulo 1: Producción y Trazabilidad (Responsable: Esperanza Franco)
* **Regla de Cálculo de Rinde:** Se calcula al cerrar el lote: `(kilosObtenidos / litrosLeche) * 100`.
* **Validación de Capacidad:** Los `litrosLeche` ingresados deben ser > 0 y <= 5800.
* **Código de Lote:** Autogenerado por el sistema en el inicio de la producción.

### 📦 Módulo 2: Stock, Pedidos y Ventas (Responsable: Veliz Condori Ruben)
* **Stock:** Es una vista calculada, NO se ingresa manualmente. El stock disponible equivale a la suma de `kilos_disponibles` de los lotes en estado *Disponible*.
* **Ventas vs. Pedidos:** Los quesos se venden **por kilo**, no solo por unidad. El pedido reserva los kilos; la venta los descuenta definitivamente de los lotes (transacción en BD).

### 👥 Módulo 3: Clientes y Cobranzas (Responsable: Moritán Victoria)
* **Clientes:** Validación estricta de CUIT único. CUIT y teléfono se manejan como valores numéricos en la validación base.
* **Cobranzas:** Se registran con un `monto_informado`. El Administrador realiza la conciliación ingresando el `monto_validado`. Si hay diferencia con el saldo de la factura, el sistema calcula automáticamente si es pago parcial o saldo a favor.

### 📊 Módulo 4: Usuarios, Reportes e Importación (Responsable: Takara Joaquín)
* **Seguridad:** Contraseñas hasheadas. Bloqueo de eliminación de usuarios (se usa baja lógica: `estado = Inactivo`).
* **Importación:** Archivos `.xlsx` o `.csv` deben ser parseados y validados contra el esquema de BD.
* **Reportes:** Exportación disponible a PDF (ej. usando `jspdf` o `react-pdf`) y Excel.

---

## 4. Estructura de Base de Datos (PostgreSQL)
El siguiente esquema detalla las entidades principales y sus atributos clave exactos para la Base de Datos. Los asistentes de código deben basar sus consultas y modelos (ORMs/Queries) en esta estructura:

### 👤 Entidades de Seguridad y Directorio
* **Usuario:**
  * `idUsuario` (int)
  * `nombre` (VARCHAR(50))
  * `apellido` (VARCHAR(50))
  * `nombreUsuario` (VARCHAR(30))
  * `email` (VARCHAR(100))
  * `password` (VARCHAR(255))
  * `activo` (TINYINT)
  * `rol` (int) FK a Rol
* **Rol:**
  * `idRol` (int)
  * `nombre` (VARCHAR(50))
* **Cliente:**
  * `idCliente` (int)
  * `razonSocial` (VARCHAR(100))
  * `cuit` (CHAR(11))
  * `domicilio` (VARCHAR(120))
  * `telefono` (VARCHAR(20))
  * `email` (VARCHAR(100))
  * `activo` (TINYINT)
  * `saldo` (DECIMAL(10,2))

### 🏭 Entidades de Producción
* **Producto:**
  * `idProducto` (int)
  * `nombre` (VARCHAR(50))
  * `rendimientoEsperado` (DECIMAL(5,2))
  * `tiempoMaduracion` (int)
  * `precioBase` (DECIMAL(10,2))
* **Tina:**
  * `idTina` (int)
  * `capacidadLitros` (int)
* **Lote:**
  * `codigoLote` (VARCHAR(20)) PK
  * `litrosLeche` (DECIMAL(8,2))
  * `kilosObtenidos` (DECIMAL(8,2))
  * `kilosDisponibles` (DECIMAL(8,2))
  * `rendimientoReal` (DECIMAL(5,2))
  * `fechaInicio` (DATETIME)
  * `fechaFin` (DATETIME)
  * `observaciones` (VARCHAR(45))
  * `idProducto` (int) FK a Producto
  * `idTina` (int) FK a Tina
  * `idUsuario` (int) FK a Usuario
  * `idEstadoLote` (int) FK a EstadoLote
* **EstadoLote:**
  * `idEstadoLote` (int)
  * `nombre` (VARCHAR(40))

### 📦 Entidades Comerciales y Trazabilidad
* **Pedido:**
  * `idPedido` (int)
  * `fecha` (DATE)
  * `observaciones` (VARCHAR(200))
  * `idCliente` (int) FK a Clientes
  * `idEstadoPedido` (int) FK a EstadoPedido
* **EstadoPedido:**
  * `idEstadoPedido` (int)
  * `nombre` (VARCHAR(45))
* **DetallePedido:**
  * `nroItem` (int)
  * `cantidadPiezas` (int)
  * `kilosSolicitados` (DECIMAL(8,2))
  * `precioKg` (DECIMAL(10,2))
  * `subtotal` (DECIMAL(10,2))
  * `idPedido` (int) FK a Pedidos
  * `idProducto` (int) FK a Producto
* **AsignacionLote:**
  * `kilosAsignados` (DECIMAL(8,2))
  * `codigoLote` (VARCHAR(20)) FK a Lotes
  * `nroItem` (int) FK a DetallePedidos
  * `idPedido` (int) FK a DetallePedidos

### 💰 Entidades Financieras
* **Venta:**
  * `idVenta` (int)
  * `fechaVenta` (DATETIME)
  * `numeroFactura` (VARCHAR(20))
  * `total` (DECIMAL(10,2))
  * `idPedido` (int) FK a Pedidos
* **Cobranza:**
  * `idCobranza` (int)
  * `fecha` (DATE)
  * `monto` (DECIMAL(10,2))
  * `observaciones` (VARCHAR(200))
  * `idVenta` (int) FK a Ventas
  * `idMedioPago` (int) FK a MedioPago
  * `idEstadoCobranza` (int) FK a EstadoCobranza
  * `idUsuario` (int) FK a Usuario
* **MedioPago:**
  * `idMedioPago` (int)
  * `nombre` (VARCHAR(30))
* **EstadoCobranza:**
  * `idEstadoCobranza` (int)
  * `nombre` (VARCHAR(30))