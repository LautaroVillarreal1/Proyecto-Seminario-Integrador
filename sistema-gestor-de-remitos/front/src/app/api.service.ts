import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Producto { idProducto: number; nombre: string; descripcion: string; precioUnitario: number; stockActual: number; stockMinimo: number; activo: boolean; categoria?: { nombre: string }; }
export interface Insumo { idInsumo: number; nombre: string; stockActual: number; stockMinimo: number; proveedor?: string; unidadDeMedida?: { nombre: string }; }
export interface Cliente { idCliente: number; nombre: string; direccion: string; numeroDeTelefono: string; provincia?: { nombre: string }; latitud?: number; longitud?: number; }
export interface Remito { idRemito: number; fechaEntrega: string; observacion?: string; inconveniente?: string; formaPago?: string; estado: { nombre: string }; cliente: Cliente; detalles: Array<{ cantidad: number; subTotal: number; producto: Producto }>; }
export interface Receta { idReceta: number; descripcion: string; rendimiento: number; unidadRendimiento: string; tiempoPrepMin: number; detalles: Array<{ cantidad: number; insumo: Insumo }>; }

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  productos(): Observable<Producto[]> { return this.http.get<Producto[]>('/api/productos'); }
  insumos(): Observable<Insumo[]> { return this.http.get<Insumo[]>('/api/insumos'); }
  clientes(): Observable<Cliente[]> { return this.http.get<Cliente[]>('/api/clientes'); }
  recetas(): Observable<Receta[]> { return this.http.get<Receta[]>('/api/recetas'); }
  remitos(filters: { desde?: string; hasta?: string } = {}): Observable<Remito[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => { if (value) params = params.set(key, value); });
    return this.http.get<Remito[]>('/api/remitos', { params });
  }
  informe(desde?: string, hasta?: string): Observable<{ totalRemitos: number; entregados: number; porEstado: Record<string, { cantidad: number; total: number }> }> {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    return this.http.get<{ totalRemitos: number; entregados: number; porEstado: Record<string, { cantidad: number; total: number }> }>('/api/informes/resumen', { params });
  }
}
