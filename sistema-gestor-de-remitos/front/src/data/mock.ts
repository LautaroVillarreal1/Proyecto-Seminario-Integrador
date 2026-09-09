import type { Usuario, Producto, Insumo, Receta, Remito } from '../types';

export const USUARIOS: Usuario[] = [
  { id: 'u1', nombre: 'Laura Martínez', email: 'laura@lacteos.com', rol: 'admin', activo: true },
  { id: 'u2', nombre: 'Sergio Bello', email: 'sergio@lacteos.com', rol: 'viajante', activo: true },
  { id: 'u3', nombre: 'Marcos Díaz', email: 'marcos@lacteos.com', rol: 'viajante', activo: true },
  { id: 'u4', nombre: 'Paula Torres', email: 'paula@lacteos.com', rol: 'viajante', activo: true },
];

export const PRODUCTOS: Producto[] = [
  { id: 'p1', nombre: 'Yogur Natural 500g', descripcion: 'Yogur natural cremoso sin azúcar', categoria: 'Yogures', unidad: 'unidad', precioVenta: 850, stockActual: 120, stockMinimo: 30, activo: true },
  { id: 'p2', nombre: 'Yogur Frutado Frutilla 500g', descripcion: 'Yogur con trocitos de frutilla', categoria: 'Yogures', unidad: 'unidad', precioVenta: 950, stockActual: 85, stockMinimo: 30, activo: true },
  { id: 'p3', nombre: 'Kéfir Natural 500ml', descripcion: 'Kéfir de leche fermentado artesanal', categoria: 'Kéfir', unidad: 'unidad', precioVenta: 1100, stockActual: 60, stockMinimo: 20, activo: true },
  { id: 'p4', nombre: 'Kéfir Agua Limón 500ml', descripcion: 'Kéfir de agua con limón', categoria: 'Kéfir', unidad: 'unidad', precioVenta: 900, stockActual: 45, stockMinimo: 20, activo: true },
  { id: 'p5', nombre: 'Granola Clásica 300g', descripcion: 'Granola con avena, miel y frutos secos', categoria: 'Granolas', unidad: 'unidad', precioVenta: 1400, stockActual: 70, stockMinimo: 15, activo: true },
  { id: 'p6', nombre: 'Granola Cacao 300g', descripcion: 'Granola con cacao y chips de chocolate', categoria: 'Granolas', unidad: 'unidad', precioVenta: 1500, stockActual: 50, stockMinimo: 15, activo: true },
  { id: 'p7', nombre: 'Yogur Griego 250g', descripcion: 'Yogur griego espeso y cremoso', categoria: 'Yogures', unidad: 'unidad', precioVenta: 1200, stockActual: 40, stockMinimo: 20, activo: true },
];

export const INSUMOS: Insumo[] = [
  { id: 'i1', nombre: 'Leche entera', unidad: 'litros', stockActual: 500, stockMinimo: 100, proveedor: 'Tambo Los Álamos', ultimoReabastecimiento: '2026-08-10', costoUnitario: 120 },
  { id: 'i2', nombre: 'Fermento láctico', unidad: 'gramos', stockActual: 800, stockMinimo: 200, proveedor: 'BioFerm SA', ultimoReabastecimiento: '2026-08-05', costoUnitario: 45 },
  { id: 'i3', nombre: 'Avena', unidad: 'kg', stockActual: 30, stockMinimo: 10, proveedor: 'Cereales del Sur', ultimoReabastecimiento: '2026-08-12', costoUnitario: 380 },
  { id: 'i4', nombre: 'Miel', unidad: 'kg', stockActual: 12, stockMinimo: 5, proveedor: 'Apicultores Unidos', ultimoReabastecimiento: '2026-08-01', costoUnitario: 2800 },
  { id: 'i5', nombre: 'Cacao en polvo', unidad: 'kg', stockActual: 8, stockMinimo: 3, proveedor: 'Distribuidora Norte', ultimoReabastecimiento: '2026-07-28', costoUnitario: 1600 },
  { id: 'i6', nombre: 'Frutillas congeladas', unidad: 'kg', stockActual: 20, stockMinimo: 8, proveedor: 'Frutos Patagónicos', ultimoReabastecimiento: '2026-08-14', costoUnitario: 950 },
  { id: 'i7', nombre: 'Azúcar', unidad: 'kg', stockActual: 40, stockMinimo: 15, proveedor: 'Distribuidora Norte', ultimoReabastecimiento: '2026-08-10', costoUnitario: 320 },
  { id: 'i8', nombre: 'Granos de kéfir', unidad: 'gramos', stockActual: 600, stockMinimo: 150, proveedor: 'BioFerm SA', ultimoReabastecimiento: '2026-08-03', costoUnitario: 80 },
  { id: 'i9', nombre: 'Frutos secos mix', unidad: 'kg', stockActual: 6, stockMinimo: 3, proveedor: 'Distribuidora Norte', ultimoReabastecimiento: '2026-08-08', costoUnitario: 4200 },
  { id: 'i10', nombre: 'Envases 500ml', unidad: 'unidades', stockActual: 400, stockMinimo: 100, proveedor: 'Envases Plásticos SRL', ultimoReabastecimiento: '2026-08-12', costoUnitario: 55 },
];

export const RECETAS: Receta[] = [
  {
    id: 'r1', productoId: 'p1', productoNombre: 'Yogur Natural 500g', rendimiento: 10, unidadRendimiento: 'unidades', tiempoPrepMin: 480,
    instrucciones: 'Calentar leche a 43°C. Agregar fermento. Mantener temperatura 6-8hs. Envasar.',
    ingredientes: [
      { insumoId: 'i1', insumoNombre: 'Leche entera', cantidad: 5, unidad: 'litros' },
      { insumoId: 'i2', insumoNombre: 'Fermento láctico', cantidad: 10, unidad: 'gramos' },
      { insumoId: 'i10', insumoNombre: 'Envases 500ml', cantidad: 10, unidad: 'unidades' },
    ],
  },
  {
    id: 'r2', productoId: 'p2', productoNombre: 'Yogur Frutado Frutilla 500g', rendimiento: 10, unidadRendimiento: 'unidades', tiempoPrepMin: 540,
    instrucciones: 'Preparar base de yogur natural. Mezclar con mermelada de frutilla. Envasar.',
    ingredientes: [
      { insumoId: 'i1', insumoNombre: 'Leche entera', cantidad: 5, unidad: 'litros' },
      { insumoId: 'i2', insumoNombre: 'Fermento láctico', cantidad: 10, unidad: 'gramos' },
      { insumoId: 'i6', insumoNombre: 'Frutillas congeladas', cantidad: 1.5, unidad: 'kg' },
      { insumoId: 'i7', insumoNombre: 'Azúcar', cantidad: 0.5, unidad: 'kg' },
      { insumoId: 'i10', insumoNombre: 'Envases 500ml', cantidad: 10, unidad: 'unidades' },
    ],
  },
  {
    id: 'r3', productoId: 'p3', productoNombre: 'Kéfir Natural 500ml', rendimiento: 8, unidadRendimiento: 'unidades', tiempoPrepMin: 1440,
    instrucciones: 'Inocular granos de kéfir en leche. Fermentar 24hs a temperatura ambiente. Colar y envasar.',
    ingredientes: [
      { insumoId: 'i1', insumoNombre: 'Leche entera', cantidad: 4, unidad: 'litros' },
      { insumoId: 'i8', insumoNombre: 'Granos de kéfir', cantidad: 80, unidad: 'gramos' },
      { insumoId: 'i10', insumoNombre: 'Envases 500ml', cantidad: 8, unidad: 'unidades' },
    ],
  },
  {
    id: 'r5', productoId: 'p5', productoNombre: 'Granola Clásica 300g', rendimiento: 15, unidadRendimiento: 'unidades', tiempoPrepMin: 60,
    instrucciones: 'Mezclar avena con miel. Agregar frutos secos. Hornear 30min a 160°C. Dejar enfriar y envasar.',
    ingredientes: [
      { insumoId: 'i3', insumoNombre: 'Avena', cantidad: 3, unidad: 'kg' },
      { insumoId: 'i4', insumoNombre: 'Miel', cantidad: 0.6, unidad: 'kg' },
      { insumoId: 'i9', insumoNombre: 'Frutos secos mix', cantidad: 0.9, unidad: 'kg' },
    ],
  },
  {
    id: 'r6', productoId: 'p6', productoNombre: 'Granola Cacao 300g', rendimiento: 12, unidadRendimiento: 'unidades', tiempoPrepMin: 60,
    instrucciones: 'Mezclar avena con miel y cacao. Hornear 30min. Enfriar y envasar.',
    ingredientes: [
      { insumoId: 'i3', insumoNombre: 'Avena', cantidad: 2.4, unidad: 'kg' },
      { insumoId: 'i4', insumoNombre: 'Miel', cantidad: 0.5, unidad: 'kg' },
      { insumoId: 'i5', insumoNombre: 'Cacao en polvo', cantidad: 0.36, unidad: 'kg' },
    ],
  },
];

export const REMITOS: Remito[] = [
  {
    id: 'rem1', numero: 'R-2026-001', fecha: '2026-08-15',
    clienteNombre: 'Dietética San Martín', clienteDireccion: 'San Martín 456, Palermo', clienteTelefono: '11-4567-8901',
    viajanteId: 'u2', viajanteNombre: 'Sergio Bello',
    items: [
      { productoId: 'p1', productoNombre: 'Yogur Natural 500g', cantidad: 12, precioUnitario: 850, subtotal: 10200 },
      { productoId: 'p5', productoNombre: 'Granola Clásica 300g', cantidad: 6, precioUnitario: 1400, subtotal: 8400 },
    ],
    subtotal: 18600, descuento: 0, total: 18600,
    estado: 'entregado',
    fechaEntrega: '2026-08-15', horaEntrega: '10:32',
    formaPago: 'transferencia',
    observaciones: 'Cliente solicitó factura B',
    creadoPor: 'u1',
  },
  {
    id: 'rem2', numero: 'R-2026-002', fecha: '2026-08-15',
    clienteNombre: 'Verdulería Orgánica La Huerta', clienteDireccion: 'Av. Córdoba 1234, Recoleta', clienteTelefono: '11-3456-7890',
    viajanteId: 'u3', viajanteNombre: 'Marcos Díaz',
    items: [
      { productoId: 'p3', productoNombre: 'Kéfir Natural 500ml', cantidad: 8, precioUnitario: 1100, subtotal: 8800 },
      { productoId: 'p2', productoNombre: 'Yogur Frutado Frutilla 500g', cantidad: 10, precioUnitario: 950, subtotal: 9500 },
    ],
    subtotal: 18300, descuento: 500, total: 17800,
    estado: 'en_camino',
    creadoPor: 'u1',
  },
  {
    id: 'rem3', numero: 'R-2026-003', fecha: '2026-08-16',
    clienteNombre: 'Supermercado El Paraíso', clienteDireccion: 'Rivadavia 3456, Flores',
    viajanteId: 'u2', viajanteNombre: 'Sergio Bello',
    items: [
      { productoId: 'p1', productoNombre: 'Yogur Natural 500g', cantidad: 24, precioUnitario: 850, subtotal: 20400 },
      { productoId: 'p7', productoNombre: 'Yogur Griego 250g', cantidad: 12, precioUnitario: 1200, subtotal: 14400 },
      { productoId: 'p6', productoNombre: 'Granola Cacao 300g', cantidad: 8, precioUnitario: 1500, subtotal: 12000 },
    ],
    subtotal: 46800, descuento: 1800, total: 45000,
    estado: 'pendiente',
    creadoPor: 'u1',
  },
  {
    id: 'rem4', numero: 'R-2026-004', fecha: '2026-08-16',
    clienteNombre: 'Cafetería Brotes', clienteDireccion: 'Honduras 5678, Palermo Soho',
    viajanteId: 'u4', viajanteNombre: 'Paula Torres',
    items: [
      { productoId: 'p3', productoNombre: 'Kéfir Natural 500ml', cantidad: 4, precioUnitario: 1100, subtotal: 4400 },
      { productoId: 'p4', productoNombre: 'Kéfir Agua Limón 500ml', cantidad: 4, precioUnitario: 900, subtotal: 3600 },
      { productoId: 'p5', productoNombre: 'Granola Clásica 300g', cantidad: 10, precioUnitario: 1400, subtotal: 14000 },
    ],
    subtotal: 22000, descuento: 0, total: 22000,
    estado: 'con_inconveniente',
    inconveniente: 'Local cerrado al momento de entrega. Se reprograma para mañana.',
    creadoPor: 'u1',
  },
  {
    id: 'rem5', numero: 'R-2026-005', fecha: '2026-08-18',
    clienteNombre: 'Bio Market Belgrano', clienteDireccion: 'Cabildo 2345, Belgrano',
    items: [
      { productoId: 'p2', productoNombre: 'Yogur Frutado Frutilla 500g', cantidad: 15, precioUnitario: 950, subtotal: 14250 },
      { productoId: 'p5', productoNombre: 'Granola Clásica 300g', cantidad: 8, precioUnitario: 1400, subtotal: 11200 },
    ],
    subtotal: 25450, descuento: 450, total: 25000,
    estado: 'borrador',
    creadoPor: 'u1',
  },
];
