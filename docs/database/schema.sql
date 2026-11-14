-- =============================================================================
-- PROYECTO LACTAR - ESQUEMA DE BASE DE DATOS (PostgreSQL / Supabase)
-- Basado en especificación oficial de AGENTS.md
-- =============================================================================

-- =============================================================================
-- 1. TABLAS DE SEGURIDAD Y DIRECTORIO
-- =============================================================================

CREATE TABLE IF NOT EXISTS "rol" (
    "idRol" SERIAL PRIMARY KEY,
    "nombre" VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS "usuario" (
    "idUsuario" SERIAL PRIMARY KEY,
    "nombre" VARCHAR(50) NOT NULL,
    "apellido" VARCHAR(50) NOT NULL,
    "nombreUsuario" VARCHAR(30) NOT NULL UNIQUE,
    "email" VARCHAR(100) NOT NULL UNIQUE,
    "password" VARCHAR(255) NOT NULL,
    "activo" SMALLINT NOT NULL DEFAULT 1,
    "rol" INT NOT NULL REFERENCES "rol"("idRol") ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "cliente" (
    "idCliente" SERIAL PRIMARY KEY,
    "razonSocial" VARCHAR(100) NOT NULL,
    "cuit" CHAR(11) NOT NULL UNIQUE,
    "domicilio" VARCHAR(120),
    "telefono" VARCHAR(20),
    "email" VARCHAR(100),
    "activo" SMALLINT NOT NULL DEFAULT 1,
    "saldo" DECIMAL(10,2) NOT NULL DEFAULT 0.00
);

-- =============================================================================
-- 2. TABLAS DE PRODUCCIÓN
-- =============================================================================

CREATE TABLE IF NOT EXISTS "producto" (
    "idProducto" SERIAL PRIMARY KEY,
    "nombre" VARCHAR(50) NOT NULL UNIQUE,
    "rendimientoEsperado" DECIMAL(5,2),
    "tiempoMaduracion" INT DEFAULT 0,
    "precioBase" DECIMAL(10,2) NOT NULL DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS "tina" (
    "idTina" SERIAL PRIMARY KEY,
    "capacidadLitros" INT NOT NULL CHECK ("capacidadLitros" > 0)
);

CREATE TABLE IF NOT EXISTS "estado_lote" (
    "idEstadoLote" SERIAL PRIMARY KEY,
    "nombre" VARCHAR(40) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS "lote" (
    "codigoLote" VARCHAR(20) PRIMARY KEY,
    "litrosLeche" DECIMAL(8,2) NOT NULL CHECK ("litrosLeche" > 0 AND "litrosLeche" <= 5800),
    "kilosObtenidos" DECIMAL(8,2) DEFAULT 0.00,
    "kilosDisponibles" DECIMAL(8,2) DEFAULT 0.00,
    "rendimientoReal" DECIMAL(5,2) DEFAULT 0.00,
    "fechaInicio" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "fechaFin" TIMESTAMP WITH TIME ZONE,
    "observaciones" VARCHAR(255),
    "idProducto" INT NOT NULL REFERENCES "producto"("idProducto") ON UPDATE CASCADE,
    "idTina" INT NOT NULL REFERENCES "tina"("idTina") ON UPDATE CASCADE,
    "idUsuario" INT NOT NULL REFERENCES "usuario"("idUsuario") ON UPDATE CASCADE,
    "idEstadoLote" INT NOT NULL REFERENCES "estado_lote"("idEstadoLote") ON UPDATE CASCADE
);

-- =============================================================================
-- 3. TABLAS COMERCIALES Y TRAZABILIDAD
-- =============================================================================

CREATE TABLE IF NOT EXISTS "estado_pedido" (
    "idEstadoPedido" SERIAL PRIMARY KEY,
    "nombre" VARCHAR(45) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS "pedido" (
    "idPedido" SERIAL PRIMARY KEY,
    "fecha" DATE NOT NULL DEFAULT CURRENT_DATE,
    "observaciones" VARCHAR(200),
    "idCliente" INT NOT NULL REFERENCES "cliente"("idCliente") ON UPDATE CASCADE,
    "idEstadoPedido" INT NOT NULL REFERENCES "estado_pedido"("idEstadoPedido") ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "detalle_pedido" (
    "idPedido" INT NOT NULL REFERENCES "pedido"("idPedido") ON DELETE CASCADE,
    "nroItem" INT NOT NULL,
    "cantidadPiezas" INT NOT NULL DEFAULT 1,
    "kilosSolicitados" DECIMAL(8,2) NOT NULL,
    "precioKg" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "idProducto" INT NOT NULL REFERENCES "producto"("idProducto") ON UPDATE CASCADE,
    PRIMARY KEY ("idPedido", "nroItem")
);

CREATE TABLE IF NOT EXISTS "asignacion_lote" (
    "idAsignacion" SERIAL PRIMARY KEY,
    "idPedido" INT NOT NULL,
    "nroItem" INT NOT NULL,
    "codigoLote" VARCHAR(20) NOT NULL REFERENCES "lote"("codigoLote") ON UPDATE CASCADE,
    "kilosAsignados" DECIMAL(8,2) NOT NULL,
    FOREIGN KEY ("idPedido", "nroItem") REFERENCES "detalle_pedido"("idPedido", "nroItem") ON DELETE CASCADE
);

-- =============================================================================
-- 4. TABLAS FINANCIERAS
-- =============================================================================

CREATE TABLE IF NOT EXISTS "estado_cobranza" (
    "idEstadoCobranza" SERIAL PRIMARY KEY,
    "nombre" VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS "medio_pago" (
    "idMedioPago" SERIAL PRIMARY KEY,
    "nombre" VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS "venta" (
    "idVenta" SERIAL PRIMARY KEY,
    "fechaVenta" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "numeroFactura" VARCHAR(20) NOT NULL UNIQUE,
    "total" DECIMAL(10,2) NOT NULL,
    "idPedido" INT REFERENCES "pedido"("idPedido") ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "cobranza" (
    "idCobranza" SERIAL PRIMARY KEY,
    "fecha" DATE NOT NULL DEFAULT CURRENT_DATE,
    "monto" DECIMAL(10,2) NOT NULL,
    "observaciones" VARCHAR(200),
    "idVenta" INT REFERENCES "venta"("idVenta") ON UPDATE CASCADE,
    "idMedioPago" INT NOT NULL REFERENCES "medio_pago"("idMedioPago") ON UPDATE CASCADE,
    "idEstadoCobranza" INT NOT NULL REFERENCES "estado_cobranza"("idEstadoCobranza") ON UPDATE CASCADE,
    "idUsuario" INT NOT NULL REFERENCES "usuario"("idUsuario") ON UPDATE CASCADE
);

-- =============================================================================
-- 5. DATOS SEMILLA (SEEDS OFICIALES - AGENTS.MD)
-- =============================================================================

-- Roles
INSERT INTO "rol" ("idRol", "nombre") VALUES
    (1, 'Administrador'),
    (2, 'Operario'),
    (3, 'Vendedor')
ON CONFLICT ("idRol") DO UPDATE SET "nombre" = EXCLUDED."nombre";

-- Tinas
INSERT INTO "tina" ("idTina", "capacidadLitros") VALUES
    (1, 5800),
    (2, 5800)
ON CONFLICT ("idTina") DO UPDATE SET "capacidadLitros" = EXCLUDED."capacidadLitros";

-- Estados de Lote
INSERT INTO "estado_lote" ("idEstadoLote", "nombre") VALUES
    (1, 'En producción'),
    (2, 'En maduración'),
    (3, 'Disponible'),
    (4, 'Reservado parcial'),
    (5, 'Reservado total'),
    (6, 'Agotado'),
    (7, 'Bloqueado'),
    (8, 'Cerrado')
ON CONFLICT ("idEstadoLote") DO UPDATE SET "nombre" = EXCLUDED."nombre";

-- Estados de Pedido
INSERT INTO "estado_pedido" ("idEstadoPedido", "nombre") VALUES
    (1, 'Pendiente'),
    (2, 'En preparación'),
    (3, 'Preparado'),
    (4, 'Confirmado'),
    (5, 'Cancelado')
ON CONFLICT ("idEstadoPedido") DO UPDATE SET "nombre" = EXCLUDED."nombre";

-- Estados de Cobranza
INSERT INTO "estado_cobranza" ("idEstadoCobranza", "nombre") VALUES
    (1, 'Pendiente de validación'),
    (2, 'Validada'),
    (3, 'Parcial'),
    (4, 'Con saldo a favor'),
    (5, 'No identificada'),
    (6, 'Rechazada'),
    (7, 'Anulada')
ON CONFLICT ("idEstadoCobranza") DO UPDATE SET "nombre" = EXCLUDED."nombre";

-- Medios de Pago
INSERT INTO "medio_pago" ("idMedioPago", "nombre") VALUES
    (1, 'Transferencia'),
    (2, 'Efectivo'),
    (3, 'Cheque'),
    (4, 'Otro medio habilitado')
ON CONFLICT ("idMedioPago") DO UPDATE SET "nombre" = EXCLUDED."nombre";

-- Catálogo de Productos
INSERT INTO "producto" ("nombre", "rendimientoEsperado", "tiempoMaduracion", "precioBase") VALUES
    ('Cremoso', 10.0, 15, 6500.00),
    ('Tybo', 9.5, 20, 7200.00),
    ('Mozzarella en cilindro', 10.2, 7, 7000.00),
    ('Mozzarella en plancha', 10.2, 7, 7000.00),
    ('Pategras', 9.0, 30, 8500.00),
    ('Fontina', 8.8, 45, 9200.00),
    ('Sardo', 8.5, 60, 9800.00),
    ('Reggianito', 8.0, 90, 10500.00),
    ('Ricotta', 4.5, 2, 4200.00),
    ('Porsalut', 9.8, 15, 6800.00),
    ('Dulce de leche 10kg', NULL, 0, 18000.00)
ON CONFLICT ("nombre") DO NOTHING;

-- Clientes de prueba
INSERT INTO "cliente" ("razonSocial", "cuit", "domicilio", "telefono", "email", "activo", "saldo") VALUES
    ('Distribuidora Sur S.A.', '30712345679', 'Calle 44 Nro 123', '2214567890', 'compras@distribuidorasur.test', 1, -45000.00),
    ('Fiambrería El Sol', '20281234564', 'Av. 7 Nro 456', '1145678901', 'administracion@elsol.test', 1, 0.00),
    ('Supermercado Centro', '30887654321', 'Calle 12 Nro 890', '2219876543', 'pagos@supercentro.test', 1, 12500.00),
    ('Lácteos del Oeste', '30654321981', 'Ruta 2 Km 58', NULL, NULL, 0, 0.00),
    ('Cooperativa Oeste', '30000000005', 'Av. Principal Nro 100', '2215550105', 'contacto@cooperativaoeste.test', 1, 0.00)
ON CONFLICT ("cuit") DO NOTHING;
