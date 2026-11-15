-- Cambia el estado de un pedido de forma atomica.
-- Aplicar despues de crear las tablas y cargar los estados de pedido.

CREATE OR REPLACE FUNCTION public.cambiar_estado_pedido_transaccional(
    p_id_pedido INT,
    p_estado TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
    v_estado_actual TEXT;
    v_id_estado_nuevo INT;
BEGIN
    IF p_id_pedido IS NULL OR p_id_pedido <= 0 THEN
        RAISE EXCEPTION USING
            ERRCODE = 'P2001',
            MESSAGE = 'El identificador del pedido no es válido.';
    END IF;

    IF p_estado IS NULL OR p_estado NOT IN (
        'En preparación',
        'Preparado',
        'Cancelado'
    ) THEN
        RAISE EXCEPTION USING
            ERRCODE = 'P2003',
            MESSAGE = 'El nuevo estado del pedido no es válido.';
    END IF;

    SELECT estado_actual."nombre"
    INTO v_estado_actual
    FROM public.pedido AS pedido
    JOIN public.estado_pedido AS estado_actual
      ON estado_actual."idEstadoPedido" = pedido."idEstadoPedido"
    WHERE pedido."idPedido" = p_id_pedido
    FOR UPDATE OF pedido;

    IF NOT FOUND THEN
        RAISE EXCEPTION USING
            ERRCODE = 'P2001',
            MESSAGE = 'No se encontró el pedido solicitado.';
    END IF;

    IF p_estado = 'En preparación'
       AND v_estado_actual <> 'Pendiente' THEN
        RAISE EXCEPTION USING
            ERRCODE = 'P2002',
            MESSAGE = 'Solo se puede iniciar la preparación de un pedido Pendiente.';
    END IF;

    IF p_estado = 'Preparado'
       AND v_estado_actual <> 'En preparación' THEN
        RAISE EXCEPTION USING
            ERRCODE = 'P2002',
            MESSAGE = 'Solo se puede marcar como Preparado un pedido En preparación.';
    END IF;

    IF p_estado = 'Cancelado'
       AND v_estado_actual NOT IN (
           'Pendiente',
           'En preparación',
           'Preparado'
       ) THEN
        RAISE EXCEPTION USING
            ERRCODE = 'P2002',
            MESSAGE = 'Solo se puede cancelar un pedido que aún no fue confirmado ni cancelado.';
    END IF;

    SELECT estado_nuevo."idEstadoPedido"
    INTO v_id_estado_nuevo
    FROM public.estado_pedido AS estado_nuevo
    WHERE estado_nuevo."nombre" = p_estado;

    IF NOT FOUND THEN
        RAISE EXCEPTION USING
            ERRCODE = 'P2004',
            MESSAGE = 'El estado solicitado no está configurado.';
    END IF;

    UPDATE public.pedido
    SET "idEstadoPedido" = v_id_estado_nuevo
    WHERE "idPedido" = p_id_pedido;

    RETURN jsonb_build_object(
        'idPedido', p_id_pedido,
        'estado', p_estado,
        'reservasLiberadas', p_estado = 'Cancelado'
    );
END;
$$;
