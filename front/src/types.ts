export type Rol = 'admin' | 'viajante';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
}

export interface Provincia {
  idProvincia: number;
  nombre: string;
}

export interface Ciudad {
  idCiudad: number;
  nombre: string;
  idProvincia: number;
}

export interface Cliente {
  id: string;
  idCliente: number;
  nombre: string;
  descripcion?: string;
  direccion: string;
  correoElectronico: string;
  numeroDeTelefono: string;
  idProvincia: number;
  provincia?: Provincia;
}

export type EstadoRemito =
  | 'borrador'
  | 'pendiente'
  | 'en_camino'
  | 'entregado'
  | 'con_inconveniente'
  | 'cancelado';

export type FormaPago =
  | 'efectivo'
  | 'transferencia'
  | 'cheque'
  | 'cuenta_corriente'
  | 'tarjeta';

export interface RemitoItem {
  productoId: string;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Remito {
  id: string;
  numero: string;
  fecha: string;
  clienteId?: number;
  clienteNombre: string;
  clienteDireccion: string;
  clienteTelefono?: string;
  viajanteId?: string;
  viajanteNombre?: string;
  items: RemitoItem[];
  subtotal: number;
  descuento: number;
  total: number;
  estado: EstadoRemito;
  fechaEntrega?: string;
  horaEntrega?: string;
  formaPago?: FormaPago;
  observaciones?: string;
  inconveniente?: string;
  creadoPor: string;
}

export interface Producto {
  id: string;
  idCategoria?: number;
  codigo: string;
  codigoBarras?: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  unidad: string;
  precioVenta: number;
  stockActual: number;
  stockMinimo: number;
  activo: boolean;
}

export interface Categoria {
  idCategoria: number;
  nombre: string;
}

export interface FaltanteStock {
  idProducto: number;
  nombre: string;
  cantidad: number;
}

export interface AlertaFabricacion extends FaltanteStock {
  id: string;
  numeroRemito: string;
}

export interface Insumo {
  id: string;
  nombre: string;
  unidad: string;
  stockActual: number;
  stockMinimo: number;
  proveedor?: string;
  ultimoReabastecimiento?: string;
  costoUnitario: number;
}

export interface RecetaIngrediente {
  insumoId: string;
  insumoNombre: string;
  cantidad: number;
  unidad: string;
}

export interface Receta {
  id: string;
  productoId: string;
  productoNombre: string;
  rendimiento: number;
  unidadRendimiento: string;
  tiempoPrepMin: number;
  instrucciones?: string;
  ingredientes: RecetaIngrediente[];
}
