export const Clientes = [
  "Distribuidora Sur S.A.",
  "Fiambrería El Sol",
  "Lácteos del Oeste",
  "Supermercado Centro",
];

export const Productos = [
  { nombre: "Cremoso", precioKg: 6800 },
  { nombre: "Tybo", precioKg: 7200 },
  { nombre: "Mozzarella", precioKg: 7600 },
  { nombre: "Pategras", precioKg: 8200 },
  { nombre: "Sardo", precioKg: 9500 },
  { nombre: "Ricotta", precioKg: 5800 },
];

export const LotesIniciales = [
  {
    codigoLote: "LT-20260901-CR-001",
    producto: "Cremoso",
    kilosDisponibles: 480,
    kilosReservados: 0,
  },
  {
    codigoLote: "LT-20260902-CR-002",
    producto: "Cremoso",
    kilosDisponibles: 315,
    kilosReservados: 0,
  },
  {
    codigoLote: "LT-20260903-SR-001",
    producto: "Sardo",
    kilosDisponibles: 220,
    kilosReservados: 0,
  },
  {
    codigoLote: "LT-20260904-RC-001",
    producto: "Ricotta",
    kilosDisponibles: 410,
    kilosReservados: 0,
  },
  {
    codigoLote: "LT-20260904-TY-001",
    producto: "Tybo",
    kilosDisponibles: 180,
    kilosReservados: 0,
  },
];

export const PedidosIniciales = [
  {
    idPedido: 1001,
    fecha: "06/09/2026",
    cliente: "Distribuidora Sur S.A.",
    estado: "En preparación",
    observaciones: "Entrega por la mañana.",
    detalles: [{ producto: "Cremoso", kilos: 120, precioKg: 6800 }],
  },
  {
    idPedido: 1002,
    fecha: "05/09/2026",
    cliente: "Fiambrería El Sol",
    estado: "Confirmado",
    observaciones: "",
    detalles: [{ producto: "Sardo", kilos: 30, precioKg: 9500 }],
  },
];
