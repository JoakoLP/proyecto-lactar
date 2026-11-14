# Observaciones del módulo de stock

## Criterio acordado

El stock disponible se calcula únicamente con los lotes cuyo estado en
`estado_lote.nombre` es `Disponible`, tal como establece `AGENTS.md`.
Los kilos de lotes en estados `Reservado parcial`, `Reservado total`, `En
producción`, `En maduración`, `Agotado`, `Bloqueado` o `Cerrado` no se cuentan
como disponibles.

Para cada lote `Disponible`, los kilos netos disponibles son sus
`lote.kilosDisponibles` menos las asignaciones activas asociadas a ese lote.
El resultado por lote no puede ser menor que cero. El stock disponible se
obtiene sumando esos resultados.

## Reservas activas

Los kilos reservados se calculan sumando `asignacion_lote.kilosAsignados` para
los pedidos cuyo estado en `estado_pedido.nombre` sea uno de:

- `Pendiente`
- `En preparación`
- `Preparado`

La relación se obtiene desde `asignacion_lote` hacia `detalle_pedido` mediante
`idPedido` y `nroItem`, y desde `detalle_pedido` hacia `pedido` mediante
`idPedido`. Para descontar la reserva de un lote se agrupan sus asignaciones
activas por `codigoLote`.

Los pedidos `Cancelado` no retienen reserva. Los pedidos `Confirmado` tampoco
se consideran reservados: se asume que su stock ya fue descontado al confirmar
la venta y que la asignación puede conservarse para trazabilidad. No deben
contabilizarse como reserva los estados adicionales o desconocidos sin una
definición explícita.

## Orden de asignación

Cuando se asignen kilos a lotes, se usará FIFO: `lote.fechaInicio` ascendente.
Si dos lotes tienen la misma fecha de inicio, se usará `lote.codigoLote`
ascendente como desempate determinista. Las asignaciones deben corresponder al
mismo producto solicitado por `detalle_pedido.idProducto`.

## Casos de aceptación

- Un lote en estado `Disponible` aporta a la disponibilidad sus
  `kilosDisponibles` menos las asignaciones de pedidos activos vinculadas a
  ese lote.
- Un lote en estado `Reservado parcial` no aporta kilos disponibles, aunque
  tenga kilos remanentes; esta consecuencia sigue el criterio acordado de
  incluir únicamente el estado `Disponible`.
- Las asignaciones de pedidos `Pendiente`, `En preparación` y `Preparado` se
  cuentan como reservadas.
- Las asignaciones de pedidos `Cancelado` y `Confirmado` no se cuentan como
  reservas activas.
- Si dos lotes empatan en `fechaInicio`, el de menor `codigoLote` se asigna
  primero.
- Si las reservas activas de un lote superan sus `kilosDisponibles`, su
  disponibilidad neta se reporta como cero; la inconsistencia debe además
  tratarse como error de datos al implementar la consulta, no ocultarse como
  un valor disponible negativo.

## Referencias del esquema

Se usan los nombres definidos en `docs/database/schema.sql`: `lote`,
`estado_lote`, `pedido`, `estado_pedido`, `detalle_pedido` y `asignacion_lote`,
con las columnas `codigoLote`, `kilosDisponibles`, `fechaInicio`,
`idEstadoLote`, `idEstadoPedido`, `idPedido`, `nroItem`, `idProducto` y
`kilosAsignados`.
