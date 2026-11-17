-- Confirma una venta y descuenta sus lotes en una sola transaccion.
-- Aplicar despues de crear las tablas y cargar los estados de pedido.

CREATE OR REPLACE FUNCTION public.confirmar_venta_pedido_transaccional(
    p_id_pedido INT
)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
    v_estado_actual TEXT;
    v_id_estado_confirmado INT;
    v_total NUMERIC;
    v_lote RECORD;
    v_id_venta INT;
    v_numero_factura VARCHAR(20);
    v_fecha_venta TIMESTAMPTZ;
BEGIN
    IF p_id_pedido IS NULL OR p_id_pedido <= 0 THEN
        RAISE EXCEPTION USING
            ERRCODE = 'P3001',
            MESSAGE = 'El identificador del pedido no es válido.';
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
            ERRCODE = 'P3001',
            MESSAGE = 'No se encontró el pedido solicitado.';
    END IF;

    IF v_estado_actual = 'Confirmado'
       OR EXISTS (
           SELECT 1
           FROM public.venta AS venta
           WHERE venta."idPedido" = p_id_pedido
       ) THEN
        RAISE EXCEPTION USING
            ERRCODE = 'P3002',
            MESSAGE = 'El pedido ya tiene una venta confirmada.';
    END IF;

    IF v_estado_actual <> 'Preparado' THEN
        RAISE EXCEPTION USING
            ERRCODE = 'P3002',
            MESSAGE = 'Solo se pueden confirmar pedidos en estado Preparado.';
    END IF;

    SELECT estado."idEstadoPedido"
    INTO v_id_estado_confirmado
    FROM public.estado_pedido AS estado
    WHERE estado."nombre" = 'Confirmado';

    IF NOT FOUND THEN
        RAISE EXCEPTION USING
            ERRCODE = 'P3006',
            MESSAGE = 'El estado Confirmado no está configurado.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.detalle_pedido AS detalle
        WHERE detalle."idPedido" = p_id_pedido
    ) THEN
        RAISE EXCEPTION USING
            ERRCODE = 'P3003',
            MESSAGE = 'El pedido no contiene detalles para vender.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.detalle_pedido AS detalle
        LEFT JOIN (
            SELECT
                asignacion."idPedido",
                asignacion."nroItem",
                SUM(asignacion."kilosAsignados") AS kilos_asignados
            FROM public.asignacion_lote AS asignacion
            WHERE asignacion."idPedido" = p_id_pedido
            GROUP BY asignacion."idPedido", asignacion."nroItem"
        ) AS asignaciones
          ON asignaciones."idPedido" = detalle."idPedido"
         AND asignaciones."nroItem" = detalle."nroItem"
        WHERE detalle."idPedido" = p_id_pedido
          AND COALESCE(asignaciones.kilos_asignados, 0)
              <> detalle."kilosSolicitados"
    ) THEN
        RAISE EXCEPTION USING
            ERRCODE = 'P3003',
            MESSAGE = 'Las asignaciones de lote no coinciden con los kilos solicitados.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.asignacion_lote AS asignacion
        JOIN public.detalle_pedido AS detalle
          ON detalle."idPedido" = asignacion."idPedido"
         AND detalle."nroItem" = asignacion."nroItem"
        JOIN public.lote AS lote
          ON lote."codigoLote" = asignacion."codigoLote"
        WHERE asignacion."idPedido" = p_id_pedido
          AND (
              asignacion."kilosAsignados" <= 0
              OR lote."idProducto" <> detalle."idProducto"
          )
    ) THEN
        RAISE EXCEPTION USING
            ERRCODE = 'P3003',
            MESSAGE = 'El pedido contiene asignaciones de lote inválidas.';
    END IF;

    PERFORM lote."codigoLote"
    FROM public.lote AS lote
    WHERE EXISTS (
        SELECT 1
        FROM public.asignacion_lote AS asignacion
        WHERE asignacion."idPedido" = p_id_pedido
          AND asignacion."codigoLote" = lote."codigoLote"
    )
    ORDER BY lote."fechaInicio", lote."codigoLote"
    FOR UPDATE OF lote;

    SELECT COALESCE(SUM(detalle."subtotal"), 0)
    INTO v_total
    FROM public.detalle_pedido AS detalle
    WHERE detalle."idPedido" = p_id_pedido;

    IF v_total > 99999999.99 THEN
        RAISE EXCEPTION USING
            ERRCODE = 'P3005',
            MESSAGE = 'El total de la venta supera el máximo permitido.';
    END IF;

    FOR v_lote IN
        SELECT
            lote."codigoLote",
            COALESCE(lote."kilosDisponibles", 0) AS kilos_disponibles,
            SUM(asignacion."kilosAsignados") AS kilos_del_pedido,
            COALESCE((
                SELECT SUM(otra_asignacion."kilosAsignados")
                FROM public.asignacion_lote AS otra_asignacion
                JOIN public.pedido AS otro_pedido
                  ON otro_pedido."idPedido" = otra_asignacion."idPedido"
                JOIN public.estado_pedido AS otro_estado
                  ON otro_estado."idEstadoPedido" = otro_pedido."idEstadoPedido"
                WHERE otra_asignacion."codigoLote" = lote."codigoLote"
                  AND otra_asignacion."idPedido" <> p_id_pedido
                  AND otro_estado."nombre" IN (
                      'Pendiente',
                      'En preparación',
                      'Preparado'
                  )
            ), 0) AS kilos_reservados_otros
        FROM public.lote AS lote
        JOIN public.asignacion_lote AS asignacion
          ON asignacion."codigoLote" = lote."codigoLote"
        WHERE asignacion."idPedido" = p_id_pedido
        GROUP BY lote."codigoLote", lote."kilosDisponibles", lote."fechaInicio"
        ORDER BY lote."fechaInicio", lote."codigoLote"
    LOOP
        IF v_lote.kilos_disponibles
           < v_lote.kilos_del_pedido + v_lote.kilos_reservados_otros THEN
            RAISE EXCEPTION USING
                ERRCODE = 'P3004',
                MESSAGE = format(
                    'El stock del lote %s no alcanza para confirmar esta venta.',
                    v_lote."codigoLote"
                );
        END IF;

        UPDATE public.lote
        SET "kilosDisponibles" =
            COALESCE("kilosDisponibles", 0) - v_lote.kilos_del_pedido
        WHERE "codigoLote" = v_lote."codigoLote";
    END LOOP;

    v_numero_factura := 'PED-' || p_id_pedido::TEXT;
    INSERT INTO public.venta (
        "numeroFactura",
        "total",
        "idPedido"
    )
    VALUES (
        v_numero_factura,
        v_total,
        p_id_pedido
    )
    RETURNING
        "idVenta",
        "fechaVenta",
        "total"
    INTO
        v_id_venta,
        v_fecha_venta,
        v_total;

    UPDATE public.pedido
    SET "idEstadoPedido" = v_id_estado_confirmado
    WHERE "idPedido" = p_id_pedido;

    RETURN jsonb_build_object(
        'idVenta', v_id_venta,
        'idPedido', p_id_pedido,
        'numeroFactura', v_numero_factura,
        'fechaVenta', v_fecha_venta,
        'total', v_total
    );
END;
$$;
