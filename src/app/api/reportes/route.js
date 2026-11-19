import { supabase } from "@/services/supabase";
import { apiError, apiSuccess } from "@/utils/apiResponse";
import { requireAuth } from "@/utils/authServer";
import { ROLES } from "@/utils/permissions";

export const dynamic = "force-dynamic";

const PERIODOS_PERMITIDOS = new Map([
  ["30", { dias: 30, etiqueta: "Últimos 30 días" }],
  ["90", { dias: 90, etiqueta: "Últimos 90 días" }],
  ["365", { dias: 365, etiqueta: "Último año" }],
  ["all", { dias: null, etiqueta: "Todo el historial" }],
]);

const ESTADOS_PEDIDO_CON_RESERVA = new Set([
  "Pendiente",
  "En preparación",
  "Preparado",
]);

const MESES_ES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

function round2(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function getRel(obj) {
  return Array.isArray(obj) ? obj[0] : obj;
}

function parseDateSafe(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function buildRendimientoHistorico(lotesPeriodo, { dias, fechaDesde, fechaHasta }) {
  if (dias === 30) {
    const startMs = fechaDesde.getTime();
    const spanMs = Math.max(fechaHasta.getTime() - startMs, 1);
    const buckets = [0, 1, 2, 3].map((idx) => ({
      etiqueta: `Semana ${idx + 1}`,
      litrosLeche: 0,
      kilosObtenidos: 0,
      cantidadLotes: 0,
      sumaRendimientoFallback: 0,
      countFallback: 0,
    }));

    for (const lote of lotesPeriodo) {
      const fecha = parseDateSafe(lote.fechaInicio);
      if (!fecha) continue;
      const ratio = (fecha.getTime() - startMs) / spanMs;
      const idx = Math.min(3, Math.max(0, Math.floor(ratio * 4)));
      const litros = Number(lote.litrosLeche) || 0;
      const kilos = Number(lote.kilosObtenidos) || 0;
      const rinde = Number(lote.rendimientoReal) || 0;

      buckets[idx].litrosLeche += litros;
      buckets[idx].kilosObtenidos += kilos;
      buckets[idx].cantidadLotes += 1;
      if (rinde > 0) {
        buckets[idx].sumaRendimientoFallback += rinde;
        buckets[idx].countFallback += 1;
      }
    }

    return buckets.map((b) => {
      const rendimiento =
        b.litrosLeche > 0 && b.kilosObtenidos > 0
          ? (b.kilosObtenidos / b.litrosLeche) * 100
          : b.countFallback > 0
            ? b.sumaRendimientoFallback / b.countFallback
            : 0;

      return {
        etiqueta: b.etiqueta,
        rendimientoPromedio: round2(rendimiento),
        kilosObtenidos: round2(b.kilosObtenidos),
        litrosLeche: round2(b.litrosLeche),
        cantidadLotes: b.cantidadLotes,
      };
    });
  }

  // Agrupación mensual para 90 días, 365 días o todo el historial
  const byMonth = new Map();
  for (const lote of lotesPeriodo) {
    const fecha = parseDateSafe(lote.fechaInicio);
    if (!fecha) continue;
    const key = `${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, "0")}`;
    const etiqueta = `${MESES_ES[fecha.getUTCMonth()]} ${fecha.getUTCFullYear()}`;
    if (!byMonth.has(key)) {
      byMonth.set(key, {
        key,
        etiqueta,
        litrosLeche: 0,
        kilosObtenidos: 0,
        cantidadLotes: 0,
        sumaRendimientoFallback: 0,
        countFallback: 0,
      });
    }
    const entry = byMonth.get(key);
    const litros = Number(lote.litrosLeche) || 0;
    const kilos = Number(lote.kilosObtenidos) || 0;
    const rinde = Number(lote.rendimientoReal) || 0;

    entry.litrosLeche += litros;
    entry.kilosObtenidos += kilos;
    entry.cantidadLotes += 1;
    if (rinde > 0) {
      entry.sumaRendimientoFallback += rinde;
      entry.countFallback += 1;
    }
  }

  return Array.from(byMonth.values())
    .sort((a, b) => a.key.localeCompare(b.key))
    .slice(-12)
    .map((b) => {
      const rendimiento =
        b.litrosLeche > 0 && b.kilosObtenidos > 0
          ? (b.kilosObtenidos / b.litrosLeche) * 100
          : b.countFallback > 0
            ? b.sumaRendimientoFallback / b.countFallback
            : 0;
      return {
        etiqueta: b.etiqueta,
        rendimientoPromedio: round2(rendimiento),
        kilosObtenidos: round2(b.kilosObtenidos),
        litrosLeche: round2(b.litrosLeche),
        cantidadLotes: b.cantidadLotes,
      };
    });
}

export async function GET(request) {
  const auth = await requireAuth(request, { roles: [ROLES.ADMIN] });
  if (auth.errorResponse) return auth.errorResponse;

  const { searchParams } = new URL(request.url);
  const diasParam = searchParams.get("dias") || "30";
  const periodoConfig = PERIODOS_PERMITIDOS.get(diasParam);

  if (!periodoConfig) {
    return apiError(
      "El parámetro 'dias' no es válido. Valores permitidos: 30, 90, 365 o all.",
      400
    );
  }

  const fechaHasta = new Date();
  const fechaDesde = periodoConfig.dias
    ? new Date(fechaHasta.getTime() - periodoConfig.dias * 24 * 60 * 60 * 1000)
    : null;

  try {
    const [
      resLotes,
      resAsignaciones,
      resPedidos,
      resVentas,
      resCobranzas,
      resClientes,
    ] = await Promise.all([
      supabase
        .from("lote")
        .select(
          "codigoLote, litrosLeche, kilosObtenidos, kilosDisponibles, rendimientoReal, fechaInicio, fechaFin, producto(idProducto, nombre, rendimientoEsperado), estado_lote(idEstadoLote, nombre)"
        )
        .order("fechaInicio", { ascending: true }),
      supabase
        .from("asignacion_lote")
        .select(
          "codigoLote, kilosAsignados, detalle_pedido(pedido(estado_pedido(nombre)))"
        ),
      supabase
        .from("pedido")
        .select(
          "idPedido, fecha, estado_pedido(nombre), detalle_pedido(kilosSolicitados, subtotal, producto(idProducto, nombre))"
        ),
      supabase
        .from("venta")
        .select("idVenta, fechaVenta, numeroFactura, total, idPedido"),
      supabase
        .from("cobranza")
        .select("idCobranza, fecha, monto, estado_cobranza(nombre)"),
      supabase.from("cliente").select("idCliente, activo, saldo"),
    ]);

    const firstError = [
      resLotes.error,
      resAsignaciones.error,
      resPedidos.error,
      resVentas.error,
      resCobranzas.error,
      resClientes.error,
    ].find(Boolean);

    if (firstError) {
      return apiError(
        "Error al consultar los datos para reportes.",
        500,
        firstError.message
      );
    }

    const lotes = resLotes.data ?? [];
    const asignaciones = resAsignaciones.data ?? [];
    const pedidos = resPedidos.data ?? [];
    const ventas = resVentas.data ?? [];
    const cobranzas = resCobranzas.data ?? [];
    const clientes = resClientes.data ?? [];

    // 1. Stock disponible actual (lotes en estado "Disponible" descontando reservas activas)
    const reservasPorLote = new Map();
    for (const asig of asignaciones) {
      const detalle = getRel(asig.detalle_pedido);
      const pedido = getRel(detalle?.pedido);
      const estadoPedido = getRel(pedido?.estado_pedido)?.nombre;
      if (!ESTADOS_PEDIDO_CON_RESERVA.has(estadoPedido)) continue;

      const kilos = Number(asig.kilosAsignados) || 0;
      reservasPorLote.set(
        asig.codigoLote,
        (reservasPorLote.get(asig.codigoLote) ?? 0) + kilos
      );
    }

    let stockDisponibleKg = 0;
    for (const lote of lotes) {
      const estadoNombre = getRel(lote.estado_lote)?.nombre;
      if (estadoNombre !== "Disponible") continue;
      const disp = Number(lote.kilosDisponibles) || 0;
      const reservado = reservasPorLote.get(lote.codigoLote) ?? 0;
      stockDisponibleKg += Math.max(0, disp - reservado);
    }

    // 2. Filtrado por período
    const enPeriodo = (fechaValor) => {
      if (!fechaDesde) return true;
      const fecha = parseDateSafe(fechaValor);
      if (!fecha) return false;
      return fecha >= fechaDesde && fecha <= fechaHasta;
    };

    const lotesPeriodo = lotes.filter((l) => enPeriodo(l.fechaInicio));
    const pedidosPeriodo = pedidos.filter((p) => enPeriodo(p.fecha));
    const ventasPeriodo = ventas.filter((v) => enPeriodo(v.fechaVenta));
    const cobranzasPeriodo = cobranzas.filter((c) => enPeriodo(c.fecha));

    // 3. KPIs de producción
    let totalKilosProducidos = 0;
    let totalLitrosProcesados = 0;
    for (const lote of lotesPeriodo) {
      totalKilosProducidos += Number(lote.kilosObtenidos) || 0;
      totalLitrosProcesados += Number(lote.litrosLeche) || 0;
    }

    const rendimientoPromedio =
      totalLitrosProcesados > 0
        ? (totalKilosProducidos / totalLitrosProcesados) * 100
        : 0;

    // 4. Rendimiento histórico
    const rendimientoHistorico = buildRendimientoHistorico(lotesPeriodo, {
      dias: periodoConfig.dias,
      fechaDesde,
      fechaHasta,
    });

    // 5. Producción por variedad
    const variedadMap = new Map();
    for (const lote of lotesPeriodo) {
      const productoNombre = getRel(lote.producto)?.nombre || "Sin producto";
      const kilos = Number(lote.kilosObtenidos) || 0;
      const litros = Number(lote.litrosLeche) || 0;

      if (!variedadMap.has(productoNombre)) {
        variedadMap.set(productoNombre, {
          producto: productoNombre,
          kilosObtenidos: 0,
          litrosLeche: 0,
          cantidadLotes: 0,
        });
      }
      const entry = variedadMap.get(productoNombre);
      entry.kilosObtenidos += kilos;
      entry.litrosLeche += litros;
      entry.cantidadLotes += 1;
    }

    const produccionPorVariedad = Array.from(variedadMap.values())
      .sort((a, b) => b.kilosObtenidos - a.kilosObtenidos)
      .map((item) => ({
        producto: item.producto,
        kilosObtenidos: round2(item.kilosObtenidos),
        litrosLeche: round2(item.litrosLeche),
        cantidadLotes: item.cantidadLotes,
        porcentaje:
          totalKilosProducidos > 0
            ? round2((item.kilosObtenidos / totalKilosProducidos) * 100)
            : 0,
        rendimientoPromedio:
          item.litrosLeche > 0
            ? round2((item.kilosObtenidos / item.litrosLeche) * 100)
            : 0,
      }));

    // 6. Pedidos por estado y ventas por producto
    const pedidosPorEstadoMap = new Map();
    const pedidosById = new Map();
    let pedidosActivos = 0;

    for (const pedido of pedidos) {
      pedidosById.set(pedido.idPedido, pedido);
      const estado = getRel(pedido.estado_pedido)?.nombre || "Sin estado";
      if (ESTADOS_PEDIDO_CON_RESERVA.has(estado)) {
        pedidosActivos += 1;
      }
    }

    for (const pedido of pedidosPeriodo) {
      const estado = getRel(pedido.estado_pedido)?.nombre || "Sin estado";
      pedidosPorEstadoMap.set(estado, (pedidosPorEstadoMap.get(estado) ?? 0) + 1);
    }

    const pedidosPorEstado = Array.from(pedidosPorEstadoMap.entries()).map(
      ([estado, cantidad]) => ({ estado, cantidad })
    );

    const ventasPorProductoMap = new Map();
    let ventasTotal = 0;

    for (const venta of ventasPeriodo) {
      ventasTotal += Number(venta.total) || 0;
      const pedido = pedidosById.get(venta.idPedido);
      const detalles = Array.isArray(pedido?.detalle_pedido)
        ? pedido.detalle_pedido
        : [];
      for (const det of detalles) {
        const nombreProd = getRel(det.producto)?.nombre || "Sin producto";
        if (!ventasPorProductoMap.has(nombreProd)) {
          ventasPorProductoMap.set(nombreProd, {
            producto: nombreProd,
            kilosVendidos: 0,
            totalVendido: 0,
          });
        }
        const entry = ventasPorProductoMap.get(nombreProd);
        entry.kilosVendidos += Number(det.kilosSolicitados) || 0;
        entry.totalVendido += Number(det.subtotal) || 0;
      }
    }

    const ventasPorProducto = Array.from(ventasPorProductoMap.values())
      .sort((a, b) => b.totalVendido - a.totalVendido)
      .map((item) => ({
        producto: item.producto,
        kilosVendidos: round2(item.kilosVendidos),
        totalVendido: round2(item.totalVendido),
      }));

    // 7. Cobranzas y clientes
    const cobranzasValidadasTotal = cobranzasPeriodo.reduce((acc, c) => {
      const estado = getRel(c.estado_cobranza)?.nombre;
      if (estado === "Validada" || estado === "Con saldo a favor") {
        return acc + (Number(c.monto) || 0);
      }
      return acc;
    }, 0);

    const clientesActivos = clientes.filter((c) => Number(c.activo) === 1).length;

    return apiSuccess(
      {
        periodo: {
          dias: periodoConfig.dias,
          clave: diasParam,
          etiqueta: periodoConfig.etiqueta,
          fechaDesde: fechaDesde ? fechaDesde.toISOString() : null,
          fechaHasta: fechaHasta.toISOString(),
        },
        kpis: {
          totalKilosProducidos: round2(totalKilosProducidos),
          totalLitrosProcesados: round2(totalLitrosProcesados),
          rendimientoPromedio: round2(rendimientoPromedio),
          cantidadLotes: lotesPeriodo.length,
          stockDisponibleKg: round2(stockDisponibleKg),
          ventasCantidad: ventasPeriodo.length,
          ventasTotal: round2(ventasTotal),
          cobranzasValidadasTotal: round2(cobranzasValidadasTotal),
          pedidosActivos,
          clientesActivos,
        },
        rendimientoHistorico,
        produccionPorVariedad,
        pedidosPorEstado,
        ventasPorProducto,
      },
      "Reportes generados correctamente."
    );
  } catch (error) {
    return apiError(
      "Error interno al generar los reportes.",
      500,
      error.message
    );
  }
}
