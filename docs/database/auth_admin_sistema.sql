-- =============================================================================
-- PROYECTO LACTAR - ADMINISTRADOR MAESTRO DEL SISTEMA (NO EDITABLE DESDE UI)
-- =============================================================================
-- Ejecutar en el SQL Editor de Supabase despues de docs/database/schema.sql.
-- Agrega la columna "esSistema" e inserta la cuenta maestra de administracion
-- con contraseña hasheada (scrypt).
--
-- Credenciales iniciales del administrador maestro:
--   Usuario:    admin
--   Email:      admin@lactar.com
--   Contraseña: AdminLactar2026!
-- =============================================================================

ALTER TABLE "usuario"
ADD COLUMN IF NOT EXISTS "esSistema" SMALLINT NOT NULL DEFAULT 0;

INSERT INTO "usuario" (
    "nombre",
    "apellido",
    "nombreUsuario",
    "email",
    "password",
    "activo",
    "rol",
    "esSistema"
) VALUES (
    'Administrador',
    'Sistema',
    'admin',
    'admin@lactar.com',
    'scrypt$d4351a068bfbd9335dfd5398af84fb1e$7e286d5679fdeffe89011d312e428914a32c6d674c663e037083ee72c0a98f0f7f0ee8d688c397c413b7b1185264fd466533f265c825cca74029819886b686a2',
    1,
    1,
    1
)
ON CONFLICT ("nombreUsuario") DO UPDATE
SET
    "activo" = 1,
    "rol" = 1,
    "esSistema" = 1;
