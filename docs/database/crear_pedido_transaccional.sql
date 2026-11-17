-- Operacion transaccional para registrar pedidos y reservar stock.
-- Aplicar despues de crear las tablas y cargar los estados de pedido/lote.

CREATE OR REPLACE FUNCTION public.crear_pedido_transaccional(
    p_id_cliente INT,
    p_observaciones TEXT,
    p_detalles JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
    v_detalle JSONB;
    v_valor TEXT;
    v_clave TEXT;
    v_id_producto INT;
    v_cantidad_piezas INT;
    v_kilos_solicitados NUMERIC(8,2);
    v_precio_kg NUMERIC(10,2);
    v_subtotal NUMERIC;
    v_id_estado_pendiente INT;
    v_id_pedido INT;
    v_nro_item INT := 0;
    v_productos INT[] := ARRAY[]::INT[];
    v_kilos_pendientes NUMERIC(8,2);
    v_kilos_asignados NUMERIC(8,2);
    v_lote RECORD;
BEGIN
    IF p_id_cliente IS NULL OR p_id_cliente <= 0 THEN
        RAISE EXCEPTION USING
            ERRCODE = 'P1001',
            MESSAGE = 'El identificador del cliente no es válido.';
    END IF;

    IF p_observaciones IS NOT NULL AND char_length(p_observaciones) > 200 THEN
        RAISE EXCEPTION USING
            ERRCODE = 'P1004',
            MESSAGE = 'Las observaciones no pueden superar los 200 caracteres.';
    END IF;

    IF jsonb_typeof(p_detalles) IS DISTINCT FROM 'array' THEN
        RAISE EXCEPTION USING
            ERRCODE = 'P1004',
            MESSAGE = 'Los detalles del pedido deben enviarse como una lista.';
    END IF;

    IF jsonb_array_length(p_detalles) = 0
       OR jsonb_array_length(p_detalles) > 100 THEN
        RAISE EXCEPTION USING
            ERRCODE = 'P1004',
            MESSAGE = 'El pedido debe incluir entre 1 y 100 detalles válidos.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.cliente AS cliente
        WHERE cliente."idCliente" = p_id_cliente
          AND cliente."activo" = 1
        FOR SHARE
    ) THEN
        RAISE EXCEPTION USING
            ERRCODE = 'P1001',
            MESSAGE = 'El cliente no existe o está inactivo.';
    END IF;

    FOR v_detalle IN
        SELECT elemento.valor
        FROM jsonb_array_elements(p_detalles) AS elemento(valor)
    LOOP
        IF jsonb_typeof(v_detalle) IS DISTINCT FROM 'object' THEN
            RAISE EXCEPTION USING
                ERRCODE = 'P1004',
                MESSAGE = 'Cada detalle del pedido debe ser un objeto.';
        END IF;

        FOR v_clave IN
            SELECT jsonb_object_keys(v_detalle)
        LOOP
            IF v_clave NOT IN (
                'idProducto',
                'cantidadPiezas',
                'kilosSolicitados'
            ) THEN
                RAISE EXCEPTION USING
                    ERRCODE = 'P1004',
                    MESSAGE = 'Un detalle contiene campos no permitidos.';
            END IF;
        END LOOP;

        IF jsonb_typeof(v_detalle->'idProducto') IS DISTINCT FROM 'number'
           OR jsonb_typeof(v_detalle->'cantidadPiezas') IS DISTINCT FROM 'number'
           OR jsonb_typeof(v_detalle->'kilosSolicitados') IS DISTINCT FROM 'number' THEN
            RAISE EXCEPTION USING
                ERRCODE = 'P1004',
                MESSAGE = 'Producto, cantidad y kilos deben ser valores numéricos.';
        END IF;

        v_valor := v_detalle->>'idProducto';
        IF v_valor !~ '^[1-9][0-9]{0,9}$' THEN
            RAISE EXCEPTION USING
                ERRCODE = 'P1002',
                MESSAGE = 'El identificador de un producto no es válido.';
        END IF;
        IF v_valor::NUMERIC > 2147483647 THEN
            RAISE EXCEPTION USING
                ERRCODE = 'P1002',
                MESSAGE = 'El identificador de un producto no es válido.';
        END IF;
        v_id_producto := v_valor::INT;

        v_valor := v_detalle->>'cantidadPiezas';
        IF v_valor !~ '^[1-9][0-9]{0,9}$' THEN
            RAISE EXCEPTION USING
                ERRCODE = 'P1004',
                MESSAGE = 'La cantidad de piezas debe ser un entero positivo.';
        END IF;
        IF v_valor::NUMERIC > 2147483647 THEN
            RAISE EXCEPTION USING
                ERRCODE = 'P1004',
                MESSAGE = 'La cantidad de piezas debe ser un entero positivo.';
        END IF;

        v_valor := v_detalle->>'kilosSolicitados';
        IF v_valor !~ '^[0-9]{1,6}([.][0-9]{1,2})?$' THEN
            RAISE EXCEPTION USING
                ERRCODE = 'P1004',
                MESSAGE = 'Los kilos solicitados deben ser mayores a 0 y tener hasta dos decimales.';
        END IF;
        IF v_valor::NUMERIC <= 0 OR v_valor::NUMERIC > 999999.99 THEN
            RAISE EXCEPTION USING
                ERRCODE = 'P1004',
                MESSAGE = 'Los kilos solicitados deben ser mayores a 0 y tener hasta dos decimales.';
        END IF;

        SELECT producto."precioBase"
        INTO v_precio_kg
        FROM public.producto AS producto
        WHERE producto."idProducto" = v_id_producto
        FOR SHARE;

        IF NOT FOUND OR v_precio_kg < 0 THEN
            RAISE EXCEPTION USING
                ERRCODE = 'P1002',
                MESSAGE = 'El producto no existe o tiene un precio inválido.';
        END IF;

        v_productos := array_append(v_productos, v_id_producto);
    END LOOP;

    SELECT estado."idEstadoPedido"
    INTO v_id_estado_pendiente
    FROM public.estado_pedido AS estado
    WHERE estado."nombre" = 'Pendiente';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No está configurado el estado de pedido Pendiente.';
    END IF;

    PERFORM lote."codigoLote"
    FROM public.lote AS lote
    JOIN public.estado_lote AS estado
      ON estado."idEstadoLote" = lote."idEstadoLote"
    WHERE lote."idProducto" = ANY(v_productos)
      AND estado."nombre" = 'Disponible'
    ORDER BY lote."fechaInicio", lote."codigoLote"
    FOR UPDATE OF lote;

    INSERT INTO public.pedido (
        "observaciones",
        "idCliente",
        "idEstadoPedido"
    )
    VALUES (
        NULLIF(btrim(p_observaciones), ''),
        p_id_cliente,
        v_id_estado_pendiente
    )
    RETURNING "idPedido" INTO v_id_pedido;

    FOR v_detalle IN
        SELECT elemento.valor
        FROM jsonb_array_elements(p_detalles) WITH ORDINALITY AS elemento(valor, orden)
        ORDER BY elemento.orden
    LOOP
        v_id_producto := (v_detalle->>'idProducto')::INT;
        v_cantidad_piezas := (v_detalle->>'cantidadPiezas')::INT;
        v_kilos_solicitados := (v_detalle->>'kilosSolicitados')::NUMERIC;

        SELECT producto."precioBase"
        INTO v_precio_kg
        FROM public.producto AS producto
        WHERE producto."idProducto" = v_id_producto;

        v_subtotal := round(v_kilos_solicitados * v_precio_kg, 2);
        IF v_subtotal > 99999999.99 THEN
            RAISE EXCEPTION USING
                ERRCODE = 'P1004',
                MESSAGE = 'El subtotal del detalle supera el máximo permitido.';
        END IF;

        v_nro_item := v_nro_item + 1;
        INSERT INTO public.detalle_pedido (
            "idPedido",
            "nroItem",
            "cantidadPiezas",
            "kilosSolicitados",
            "precioKg",
            "subtotal",
            "idProducto"
        )
        VALUES (
            v_id_pedido,
            v_nro_item,
            v_cantidad_piezas,
            v_kilos_solicitados,
            v_precio_kg,
            v_subtotal,
            v_id_producto
        );

        v_kilos_pendientes := v_kilos_solicitados;
        FOR v_lote IN
            SELECT
                lote."codigoLote",
                COALESCE(lote."kilosDisponibles", 0) - COALESCE((
                    SELECT SUM(asignacion."kilosAsignados")
                    FROM public.asignacion_lote AS asignacion
                    JOIN public.pedido AS pedido
                      ON pedido."idPedido" = asignacion."idPedido"
                    JOIN public.estado_pedido AS estado_pedido
                      ON estado_pedido."idEstadoPedido" = pedido."idEstadoPedido"
                    WHERE asignacion."codigoLote" = lote."codigoLote"
                      AND estado_pedido."nombre" IN (
                          'Pendiente',
                          'En preparación',
                          'Preparado'
                      )
                ), 0) AS kilos_libres
            FROM public.lote AS lote
            JOIN public.estado_lote AS estado_lote
              ON estado_lote."idEstadoLote" = lote."idEstadoLote"
            WHERE lote."idProducto" = v_id_producto
              AND estado_lote."nombre" = 'Disponible'
            ORDER BY lote."fechaInicio", lote."codigoLote"
        LOOP
            IF v_lote.kilos_libres < 0 THEN
                RAISE EXCEPTION USING
                    ERRCODE = 'P1005',
                    MESSAGE = 'Las reservas existentes superan el stock de un lote.';
            END IF;

            v_kilos_asignados := LEAST(
                v_kilos_pendientes,
                v_lote.kilos_libres
            );
            IF v_kilos_asignados > 0 THEN
                INSERT INTO public.asignacion_lote (
                    "idPedido",
                    "nroItem",
                    "codigoLote",
                    "kilosAsignados"
                )
                VALUES (
                    v_id_pedido,
                    v_nro_item,
                    v_lote."codigoLote",
                    v_kilos_asignados
                );
                v_kilos_pendientes := v_kilos_pendientes - v_kilos_asignados;
            END IF;

            EXIT WHEN v_kilos_pendientes = 0;
        END LOOP;

        IF v_kilos_pendientes > 0 THEN
            RAISE EXCEPTION USING
                ERRCODE = 'P1003',
                MESSAGE = format(
                    'Stock insuficiente para el producto %s.',
                    v_id_producto
                );
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'idPedido', v_id_pedido,
        'idCliente', p_id_cliente,
        'idEstadoPedido', v_id_estado_pendiente
    );
END;
$$;
