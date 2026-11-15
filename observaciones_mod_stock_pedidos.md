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

## Alta transaccional de pedidos

La función `public.crear_pedido_transaccional` del archivo
`docs/database/crear_pedido_transaccional.sql` crea el pedido, sus detalles y
sus asignaciones de lote dentro de una misma transacción. La ruta
`POST /api/pedidos` valida la estructura del cuerpo y delega la escritura a esa
función; el precio por kilo se toma de `producto.precioBase`, no del cliente.

El cuerpo de la solicitud acepta `idCliente`, `observaciones` opcionales y una
lista `detalles` con `idProducto`, `cantidadPiezas` y `kilosSolicitados` por
ítem. No acepta precios enviados por el cliente.

La función bloquea en orden FIFO los lotes `Disponible` de los productos
solicitados y calcula el remanente descontando las asignaciones activas. Si el
cliente no existe o está inactivo, el producto o las cantidades son inválidos,
el subtotal excede la capacidad de la columna o el stock no alcanza, la
operación devuelve un error y la transacción revierte el pedido y cualquier
asignación parcial. El bloqueo serializa las altas concurrentes que compiten
por los mismos lotes.

Para desplegar esta operación en Supabase, hay que aplicar
`docs/database/crear_pedido_transaccional.sql` después de crear las tablas y
cargar los estados de lote y pedido.
Las escrituras se hacen desde la ruta del servidor; no deben trasladarse al
cliente. La consulta `GET /api/pedidos` permanece sin cambios.

## Cambios de estado y liberación de reservas

La función `public.cambiar_estado_pedido_transaccional` de
`docs/database/cambiar_estado_pedido_transaccional.sql` actualiza un pedido
bloqueando su fila y validando su estado actual. La ruta
`PATCH /api/pedidos/[idPedido]` permite iniciar la preparación
(`Pendiente` → `En preparación`), marcar el pedido preparado
(`En preparación` → `Preparado`) y cancelar desde cualquiera de esos estados
activos.

Al cancelar, se conserva la relación de `asignacion_lote` para trazabilidad,
pero el estado `Cancelado` deja de contarse entre las reservas activas. Así, la
consulta de stock vuelve a incluir esos kilos sin borrar la historia de la
asignación. Los pedidos confirmados o ya cancelados no pueden volver a
transicionar mediante esta operación.

Para desplegar los cambios de estado en Supabase, aplicar
`docs/database/cambiar_estado_pedido_transaccional.sql` después de crear las
tablas y cargar los estados de pedido.

## Confirmación transaccional de ventas

La función `public.confirmar_venta_pedido_transaccional` de
`docs/database/confirmar_venta_pedido_transaccional.sql` acepta únicamente
pedidos `Preparado`. Bloquea el pedido y sus lotes en orden determinista,
verifica que las asignaciones cubran exactamente los kilos de cada detalle y
que descontarlos no consuma stock reservado para otros pedidos. En la misma
transacción descuenta `lote.kilosDisponibles`, crea una fila en `venta` con
factura `PED-<idPedido>` y cambia el pedido a `Confirmado`.

Las asignaciones se conservan para trazabilidad, pero los pedidos `Confirmado`
no se cuentan entre las reservas activas. La fila del pedido se bloquea y se
verifica que no exista ya una venta asociada, por lo que confirmaciones
concurrentes o repetidas no generan una segunda venta.

La confirmación se expone mediante `POST /api/pedidos/[idPedido]/confirmar`.
Para desplegarla en Supabase, aplicar
`docs/database/confirmar_venta_pedido_transaccional.sql` después de crear las
tablas y cargar los estados de pedido.
