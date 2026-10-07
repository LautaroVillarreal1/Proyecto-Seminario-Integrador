import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Usuario, Remito, Producto, Insumo, Receta, Cliente, Provincia, Ciudad } from '../types';
import { USUARIOS, REMITOS, PRODUCTOS, INSUMOS, RECETAS } from '../data/mock';

interface AppContextType {
  notifyError: (message: string) => void;
  currentUser: Usuario | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  usuarios: Usuario[];
  clientes: Cliente[];
  provincias: Provincia[];
  ciudades: Ciudad[];
  addCliente: (cliente: Omit<Cliente, 'id' | 'idCliente' | 'provincia'>) => Promise<Cliente | null>;
  remitos: Remito[];
  setRemitos: (r: Remito[]) => void;
  addRemito: (r: Remito) => Promise<Remito | null>;
  updateRemito: (r: Remito) => void;
  productos: Producto[];
  setProductos: (p: Producto[]) => Promise<Producto | null>;
  insumos: Insumo[];
  setInsumos: (i: Insumo[]) => Promise<Insumo | null>;
  recetas: Receta[];
  setRecetas: (r: Receta[]) => Promise<Receta | null>;
  productDetailId: string | null;
  openProductDetails: (id: string) => void;
  closeProductDetails: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

function dedupeRemitos(items: Remito[]) {
  const seen = new Map<string, Remito>();
  for (const item of items) {
    if (!seen.has(item.id)) seen.set(item.id, item);
  }
  return Array.from(seen.values());
}

function mergeRemitos(previous: Remito[], incoming: Remito[]) {
  const byId = new Map<string, Remito>();
  for (const item of previous) byId.set(item.id, item);
  for (const item of incoming) byId.set(item.id, item);
  return dedupeRemitos(Array.from(byId.values()));
}

const estadoToId: Record<Remito['estado'], number> = { borrador: 1, pendiente: 4, en_camino: 8, entregado: 5, con_inconveniente: 7, cancelado: 3 };

function mapEstado(idEstado: number, nombre: string): Remito['estado'] {
  if (nombre === 'EnCamino' || idEstado === 8) return 'en_camino';
  if (nombre === 'Firmado' || nombre === 'Cobrado' || idEstado === 5 || idEstado === 6) return 'entregado';
  if (nombre === 'Rechazado' || idEstado === 7) return 'con_inconveniente';
  if (nombre === 'Anulado' || idEstado === 3) return 'cancelado';
  if (nombre === 'ListoParaEntrega' || idEstado === 4) return 'pendiente';
  return 'borrador';
}

function mapRemito(value: any): Remito {
  const estado = mapEstado(value.idEstado ?? value.estado?.idEstado, value.estado?.nombre ?? '');
  const detalles = value.detalles ?? [];
  const subtotal = detalles.reduce((total: number, detail: any) => total + Number(detail.subTotal ?? 0), 0);
  const descuento = Number(value.descuento ?? 0);
  return {
    id: `rem${value.idRemito ?? value.id}`,
    numero: value.numero ?? `R-2026-${String(value.idRemito ?? value.id).padStart(3, '0')}`,
    fecha: new Date(value.fechaEntrega).toISOString().split('T')[0],
    clienteId: value.cliente?.idCliente ?? value.idCliente,
    clienteNombre: value.cliente?.nombre ?? value.clienteNombre ?? 'Cliente',
    clienteDireccion: value.cliente?.direccion ?? value.clienteDireccion ?? '',
    clienteTelefono: value.cliente?.numeroDeTelefono ?? value.clienteTelefono,
    viajanteId: value.usuario?.idUsuario ? `u${value.usuario.idUsuario}` : value.viajanteId,
    viajanteNombre: value.usuario ? `${value.usuario.nombre} ${value.usuario.apellido}` : value.viajanteNombre,
    items: detalles.map((detail: any) => ({ productoId: `p${detail.idProducto}`, productoNombre: detail.producto?.nombre ?? 'Producto', cantidad: detail.cantidad, precioUnitario: Number(detail.producto?.precioUnitario ?? 0), subtotal: Number(detail.subTotal ?? 0) })),
    subtotal,
    descuento,
    total: subtotal - descuento,
    estado,
    fechaEntrega: value.fechaEntregaReal ? new Date(value.fechaEntregaReal).toISOString().split('T')[0] : undefined,
    formaPago: value.formaPago,
    observaciones: value.observacion,
    inconveniente: value.inconveniente,
    creadoPor: value.usuario?.idUsuario ? `u${value.usuario.idUsuario}` : 'u1',
  };
}

function mapCliente(value: any): Cliente {
  return {
    id: `c${value.idCliente}`,
    idCliente: value.idCliente,
    nombre: value.nombre,
    descripcion: value.descripcion ?? undefined,
    direccion: value.direccion,
    correoElectronico: value.correoElectronico,
    numeroDeTelefono: value.numeroDeTelefono,
    idProvincia: value.idProvincia,
    provincia: value.provincia ? { idProvincia: value.provincia.idProvincia, nombre: value.provincia.nombre } : undefined,
  };
}

function mapProducto(value: any): Producto {
  return {
    id: `p${value.idProducto}`,
    codigo: value.codigo ?? '',
    codigoBarras: value.codigoBarras ?? undefined,
    nombre: value.nombre,
    descripcion: value.descripcion,
    categoria: value.categoria?.nombre ?? 'Sin categoría',
    unidad: value.unidadDeMedida?.nombre ?? 'unidad',
    precioVenta: Number(value.precioUnitario),
    stockActual: Number(value.stockActual),
    stockMinimo: Number(value.stockMinimo),
    activo: value.activo,
  };
}

function mapInsumo(value: any): Insumo {
  return { id: `i${value.idInsumo}`, nombre: value.nombre, unidad: value.unidadDeMedida?.nombre ?? 'unidad', stockActual: Number(value.stockActual), stockMinimo: Number(value.stockMinimo), proveedor: value.proveedor, costoUnitario: Number(value.costoUnitario) };
}

function mapReceta(value: any): Receta {
  const product = value.productos?.[0];
  return { id: `r${value.idReceta}`, productoId: product ? `p${product.idProducto}` : '', productoNombre: product?.nombre ?? value.descripcion, rendimiento: Number(value.rendimiento), unidadRendimiento: value.unidadRendimiento, tiempoPrepMin: value.tiempoPrepMin, instrucciones: value.instrucciones, ingredientes: (value.detalles ?? []).map((detail: any) => ({ insumoId: `i${detail.idInsumo}`, insumoNombre: detail.insumo?.nombre ?? 'Insumo', cantidad: Number(detail.cantidad), unidad: detail.insumo?.unidadDeMedida?.nombre ?? 'unidad' })) };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [notification, setNotification] = useState<{ id: number; message: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [productDetailId, setProductDetailId] = useState<string | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>(USUARIOS);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [provincias, setProvincias] = useState<Provincia[]>([]);
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [remitos, setRemitos] = useState<Remito[]>(REMITOS);
  const [productos, setProductosState] = useState<Producto[]>(PRODUCTOS);
  const [insumos, setInsumosState] = useState<Insumo[]>(INSUMOS);
  const [recetas, setRecetasState] = useState<Receta[]>(RECETAS);
  const [token, setToken] = useState(() => localStorage.getItem('accessToken') || '');

  useEffect(() => {
    if (!notification) return;
    const timeout = window.setTimeout(() => setNotification(null), 6000);
    return () => window.clearTimeout(timeout);
  }, [notification]);

  const notifyError = (message: string) => setNotification({ id: Date.now(), message });

  const saveMutation = async (url: string, method: string, payload: unknown, fallback: string) => {
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const detail = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
        throw new Error(`${fallback} (HTTP ${response.status})${detail ? `: ${detail}` : ''}`);
      }
      return await response.json().catch(() => null);
    } catch (error) {
      notifyError(error instanceof Error ? error.message : fallback);
      return false;
    }
  };

  useEffect(() => {
    let events: EventSource | null = null;
    let retry: number | undefined;

    const connect = () => {
      events = new EventSource('/api/realtime/remitos');
      events.onmessage = message => {
        const event = JSON.parse(message.data) as { type?: string; remito?: Remito };
        if (event.type !== 'remito.updated' || !event.remito) return;
        const incoming = mapRemito(event.remito);
        setRemitos(previous => mergeRemitos(previous, [incoming]));
      };
      events.onerror = () => {
        events?.close();
        retry = window.setTimeout(connect, 2000);
      };
    };

    connect();
    return () => {
      events?.close();
      if (retry) window.clearTimeout(retry);
    };
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ correoElectronico: email, password }) });
    if (!response.ok) return false;
    const data = await response.json();
    const user: Usuario = { id: `u${data.user.idUsuario}`, nombre: `${data.user.nombre} ${data.user.apellido}`, email: data.user.correoElectronico, rol: data.user.idRol === 3 ? 'viajante' : 'admin', activo: data.user.activo };
    localStorage.setItem('accessToken', data.accessToken);
    setToken(data.accessToken);
    setCurrentUser(user);
    const headers = { Authorization: `Bearer ${data.accessToken}` };
    const [remitosResponse, productosResponse, insumosResponse, recetasResponse, usuariosResponse, clientesResponse, provinciasResponse, ciudadesResponse] = await Promise.all([
      fetch('/api/remitos', { headers }), fetch('/api/productos', { headers }), fetch('/api/insumos', { headers }), fetch('/api/recetas', { headers }),
      user.rol === 'admin' ? fetch('/api/usuarios', { headers }) : Promise.resolve(null),
      fetch('/api/clientes', { headers }), fetch('/api/provincias', { headers }), fetch('/api/ciudades', { headers }),
    ]);
    if (remitosResponse.ok) {
      const fetched = (await remitosResponse.json()).map(mapRemito);
      setRemitos(fetched);
    }
    if (productosResponse.ok) setProductosState((await productosResponse.json()).map(mapProducto));
    if (insumosResponse.ok) setInsumosState((await insumosResponse.json()).map(mapInsumo));
    if (recetasResponse.ok) setRecetasState((await recetasResponse.json()).map(mapReceta));
    if (usuariosResponse?.ok) setUsuarios((await usuariosResponse.json()).map((item: any) => ({ id: `u${item.idUsuario}`, nombre: `${item.nombre} ${item.apellido}`, email: item.correoElectronico, rol: item.idRol === 3 ? 'viajante' : 'admin', activo: item.activo })));
    if (clientesResponse.ok) setClientes((await clientesResponse.json()).map(mapCliente));
    if (provinciasResponse.ok) setProvincias((await provinciasResponse.json()).map((item: any) => ({ idProvincia: item.idProvincia, nombre: item.nombre })));
    if (ciudadesResponse.ok) setCiudades((await ciudadesResponse.json()).map((item: any) => ({ idCiudad: item.idCiudad, nombre: item.nombre, idProvincia: item.idProvincia })));
    return true;
  };

  const logout = () => { localStorage.removeItem('accessToken'); setToken(''); setCurrentUser(null); };

  const addCliente = async (cliente: Omit<Cliente, 'id' | 'idCliente' | 'provincia'>): Promise<Cliente | null> => {
    const result = await saveMutation('/api/clientes', 'POST', cliente, 'No se pudo guardar el cliente.');
    if (!result) return null;
    const provincia = provincias.find(item => item.idProvincia === result.idProvincia);
    const persisted = mapCliente({ ...result, provincia: result.provincia ?? provincia });
    setClientes(previous => [...previous, persisted].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')));
    return persisted;
  };

  const setProductos = async (next: Producto[]): Promise<Producto | null> => {
    const previous = productos;
    const changed = next.find(item => JSON.stringify(item) !== JSON.stringify(previous.find(old => old.id === item.id)));
    if (!changed) { setProductosState(next); return next[0] ?? null; }
    const id = Number(changed.id.replace('p', ''));
    const isNew = !previous.some(item => item.id === changed.id);
    const payload = {
      codigo: changed.codigo?.trim(),
      codigoBarras: changed.codigoBarras?.trim() || undefined,
      nombre: changed.nombre,
      descripcion: changed.descripcion,
      precioUnitario: Math.max(0, Number(changed.precioVenta) || 0),
      peso: 0,
      idUnidadDeMedida: 1,
      idCategoria: 1,
      stockActual: Math.max(0, Number(changed.stockActual) || 0),
      stockMinimo: Math.max(0, Number(changed.stockMinimo) || 0),
      activo: changed.activo,
    };
    const result = await saveMutation(!isNew ? `/api/productos/${id}` : '/api/productos', !isNew ? 'PATCH' : 'POST', payload, 'No se pudo guardar el producto.');
    if (!result) return null;
    const persisted = isNew && result.idProducto ? { ...changed, id: `p${result.idProducto}` } : changed;
    setProductosState(next.map(item => item.id === changed.id ? persisted : item));
    return persisted;
  };

  const setInsumos = async (next: Insumo[]): Promise<Insumo | null> => {
    const previous = insumos;
    const changed = next.find(item => JSON.stringify(item) !== JSON.stringify(previous.find(old => old.id === item.id)));
    if (!changed) { setInsumosState(next); return next[0] ?? null; }
    const id = Number(changed.id.replace('i', ''));
    const isNew = !previous.some(item => item.id === changed.id);
    const payload = { nombre: changed.nombre, descripcion: '', idUnidadDeMedida: 1, stockActual: changed.stockActual, stockMinimo: changed.stockMinimo, costoUnitario: changed.costoUnitario, proveedor: changed.proveedor };
    const result = await saveMutation(!isNew ? `/api/insumos/${id}` : '/api/insumos', !isNew ? 'PATCH' : 'POST', payload, 'No se pudo guardar el insumo.');
    if (!result) return null;
    const persisted = isNew && result.idInsumo ? { ...changed, id: `i${result.idInsumo}` } : changed;
    setInsumosState(next.map(item => item.id === changed.id ? persisted : item));
    return persisted;
  };

  const setRecetas = async (next: Receta[]): Promise<Receta | null> => {
    const previous = recetas;
    const changed = next.find(item => JSON.stringify(item) !== JSON.stringify(previous.find(old => old.id === item.id)));
    if (!changed) { setRecetasState(next); return next[0] ?? null; }

    const id = Number(changed.id.replace('r', ''));
    const isNew = !previous.some(item => item.id === changed.id);
    const payload = {
      idProducto: changed.productoId ? Number(changed.productoId.replace('p', '')) : undefined,
      descripcion: changed.productoNombre,
      rendimiento: Math.max(0, Number(changed.rendimiento) || 0),
      unidadRendimiento: changed.unidadRendimiento,
      tiempoPrepMin: Math.max(0, Number(changed.tiempoPrepMin) || 0),
      instrucciones: changed.instrucciones ?? '',
      detalles: changed.ingredientes.map(ingredient => ({
        idInsumo: Number(ingredient.insumoId.replace('i', '')),
        cantidad: Math.max(0, Number(ingredient.cantidad) || 0),
      })),
    };

    const result = await saveMutation(!isNew ? `/api/recetas/${id}` : '/api/recetas', !isNew ? 'PATCH' : 'POST', payload, 'No se pudo guardar la receta.');
    if (!result) return null;
    const persisted = isNew && result.idReceta ? { ...changed, id: `r${result.idReceta}` } : changed;
    setRecetasState(next.map(item => item.id === changed.id ? persisted : item));
    return persisted;
  };

  const addRemito = async (r: Remito) => {
    try {
      if (!r.clienteId) throw new Error('Seleccioná un cliente antes de guardar el remito.');
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
      const response = await fetch('/api/remitos', { method: 'POST', headers, body: JSON.stringify({ fechaEntrega: `${r.fecha}T10:00:00.000Z`, horaEntrega: `${r.fecha}T10:00:00.000Z`, idEstado: estadoToId[r.estado], idCliente: r.clienteId, idResponsableEntrega: r.viajanteId ? Number(r.viajanteId.replace('u', '')) : undefined, observacion: r.observaciones, descuento: r.descuento, detalles: r.items.map(item => ({ idProducto: Number(item.productoId.replace('p', '')), cantidad: item.cantidad })) }) });

      if (!response.ok) {
        let serverMessage = 'No se pudo guardar el remito en el servidor.';
        try {
          const errorBody = await response.json();
          if (errorBody?.message) serverMessage = errorBody.message;
        } catch {
          try {
            const text = await response.text();
            if (text) serverMessage = text;
          } catch {
            serverMessage = 'No se pudo guardar el remito en el servidor.';
          }
        }
        console.error(serverMessage);
        throw new Error(serverMessage);
      }

      const createdBody = await response.json();
      const created = mapRemito(createdBody);
      return created;
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
        throw error;
      }
      console.error('No se pudo guardar el remito en el servidor.', error);
      throw new Error('No se pudo guardar el remito en el servidor.');
    }
  };
  const updateRemito = (r: Remito) => {
    setRemitos(prev => prev.map(x => (x.id === r.id ? r : x)));
    const id = Number(r.id.replace('rem', ''));
    void fetch(`/api/remitos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ idEstado: estadoToId[r.estado], observacion: r.observaciones, inconveniente: r.inconveniente, formaPago: r.formaPago, fechaEntregaReal: r.fechaEntrega ? `${r.fechaEntrega}T${r.horaEntrega ?? '00:00'}:00` : undefined }),
    });
  };

  return (
    <AppContext.Provider value={{
      notifyError, currentUser, login, logout, usuarios,
      clientes, provincias, ciudades, addCliente,
      remitos, setRemitos, addRemito, updateRemito,
      productos, setProductos,
      insumos, setInsumos,
      recetas, setRecetas,
      productDetailId,
      openProductDetails: id => setProductDetailId(id),
      closeProductDetails: () => setProductDetailId(null),
    }}>
      {children}
      {notification && (
        <div key={notification.id} role="alert" className="fixed bottom-5 right-5 z-50 max-w-md rounded-lg border px-4 py-3 text-sm shadow-lg" style={{ background: '#FEE2E2', borderColor: '#FCA5A5', color: '#7F1D1D' }}>
          {notification.message}
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
