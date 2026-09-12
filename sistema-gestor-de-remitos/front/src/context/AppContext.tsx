import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Usuario, Remito, Producto, Insumo, Receta } from '../types';
import { USUARIOS, REMITOS, PRODUCTOS, INSUMOS, RECETAS } from '../data/mock';

interface AppContextType {
  currentUser: Usuario | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  usuarios: Usuario[];
  remitos: Remito[];
  setRemitos: (r: Remito[]) => void;
  addRemito: (r: Remito) => Promise<Remito | null>;
  updateRemito: (r: Remito) => void;
  productos: Producto[];
  setProductos: (p: Producto[]) => void;
  insumos: Insumo[];
  setInsumos: (i: Insumo[]) => void;
  recetas: Receta[];
  setRecetas: (r: Receta[]) => void;
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
  return {
    id: `rem${value.idRemito ?? value.id}`,
    numero: value.numero ?? `R-2026-${String(value.idRemito ?? value.id).padStart(3, '0')}`,
    fecha: new Date(value.fechaEntrega).toISOString().split('T')[0],
    clienteNombre: value.cliente?.nombre ?? value.clienteNombre ?? 'Cliente',
    clienteDireccion: value.cliente?.direccion ?? value.clienteDireccion ?? '',
    clienteTelefono: value.cliente?.numeroDeTelefono ?? value.clienteTelefono,
    viajanteId: value.usuario?.idUsuario ? `u${value.usuario.idUsuario}` : value.viajanteId,
    viajanteNombre: value.usuario ? `${value.usuario.nombre} ${value.usuario.apellido}` : value.viajanteNombre,
    items: detalles.map((detail: any) => ({ productoId: `p${detail.idProducto}`, productoNombre: detail.producto?.nombre ?? 'Producto', cantidad: detail.cantidad, precioUnitario: Number(detail.producto?.precioUnitario ?? 0), subtotal: Number(detail.subTotal ?? 0) })),
    subtotal: detalles.reduce((total: number, detail: any) => total + Number(detail.subTotal ?? 0), 0),
    descuento: 0,
    total: detalles.reduce((total: number, detail: any) => total + Number(detail.subTotal ?? 0), 0),
    estado,
    fechaEntrega: value.fechaEntregaReal ? new Date(value.fechaEntregaReal).toISOString().split('T')[0] : undefined,
    formaPago: value.formaPago,
    observaciones: value.observacion,
    inconveniente: value.inconveniente,
    creadoPor: value.usuario?.idUsuario ? `u${value.usuario.idUsuario}` : 'u1',
  };
}

function mapProducto(value: any): Producto {
  return { id: `p${value.idProducto}`, nombre: value.nombre, descripcion: value.descripcion, categoria: value.categoria?.nombre ?? 'Sin categoría', unidad: value.unidadDeMedida?.nombre ?? 'unidad', precioVenta: Number(value.precioUnitario), stockActual: Number(value.stockActual), stockMinimo: Number(value.stockMinimo), activo: value.activo };
}

function mapInsumo(value: any): Insumo {
  return { id: `i${value.idInsumo}`, nombre: value.nombre, unidad: value.unidadDeMedida?.nombre ?? 'unidad', stockActual: Number(value.stockActual), stockMinimo: Number(value.stockMinimo), proveedor: value.proveedor, costoUnitario: Number(value.costoUnitario) };
}

function mapReceta(value: any): Receta {
  const product = value.productos?.[0];
  return { id: `r${value.idReceta}`, productoId: product ? `p${product.idProducto}` : '', productoNombre: product?.nombre ?? value.descripcion, rendimiento: Number(value.rendimiento), unidadRendimiento: value.unidadRendimiento, tiempoPrepMin: value.tiempoPrepMin, instrucciones: value.instrucciones, ingredientes: (value.detalles ?? []).map((detail: any) => ({ insumoId: `i${detail.idInsumo}`, insumoNombre: detail.insumo?.nombre ?? 'Insumo', cantidad: Number(detail.cantidad), unidad: detail.insumo?.unidadDeMedida?.nombre ?? 'unidad' })) };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>(USUARIOS);
  const [remitos, setRemitos] = useState<Remito[]>(REMITOS);
  const [productos, setProductosState] = useState<Producto[]>(PRODUCTOS);
  const [insumos, setInsumosState] = useState<Insumo[]>(INSUMOS);
  const [recetas, setRecetas] = useState<Receta[]>(RECETAS);
  const [token, setToken] = useState(() => localStorage.getItem('accessToken') || '');

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
    const [remitosResponse, productosResponse, insumosResponse, recetasResponse, usuariosResponse] = await Promise.all([
      fetch('/api/remitos', { headers }), fetch('/api/productos', { headers }), fetch('/api/insumos', { headers }), fetch('/api/recetas', { headers }),
      user.rol === 'admin' ? fetch('/api/usuarios', { headers }) : Promise.resolve(null),
    ]);
    if (remitosResponse.ok) {
      const fetched = (await remitosResponse.json()).map(mapRemito);
      setRemitos(previous => mergeRemitos(previous, fetched));
    }
    if (productosResponse.ok) setProductosState((await productosResponse.json()).map(mapProducto));
    if (insumosResponse.ok) setInsumosState((await insumosResponse.json()).map(mapInsumo));
    if (recetasResponse.ok) setRecetas((await recetasResponse.json()).map(mapReceta));
    if (usuariosResponse?.ok) setUsuarios((await usuariosResponse.json()).map((item: any) => ({ id: `u${item.idUsuario}`, nombre: `${item.nombre} ${item.apellido}`, email: item.correoElectronico, rol: item.idRol === 3 ? 'viajante' : 'admin', activo: item.activo })));
    return true;
  };

  const logout = () => { localStorage.removeItem('accessToken'); setToken(''); setCurrentUser(null); };

  const setProductos = (next: Producto[]) => {
    const previous = productos;
    setProductosState(next);
    const changed = next.find(item => JSON.stringify(item) !== JSON.stringify(previous.find(old => old.id === item.id)));
    if (!changed) return;
    const id = Number(changed.id.replace('p', ''));
    const isNew = !previous.some(item => item.id === changed.id);
    const payload = { nombre: changed.nombre, descripcion: changed.descripcion, precioUnitario: changed.precioVenta, peso: 0, idUnidadDeMedida: 1, idCategoria: changed.categoria === 'Kéfir' ? 3 : changed.categoria === 'Granolas' ? 4 : 1, stockActual: changed.stockActual, stockMinimo: changed.stockMinimo, activo: changed.activo };
    void fetch(!isNew ? `/api/productos/${id}` : '/api/productos', { method: !isNew ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
  };

  const setInsumos = (next: Insumo[]) => {
    const previous = insumos;
    setInsumosState(next);
    const changed = next.find(item => JSON.stringify(item) !== JSON.stringify(previous.find(old => old.id === item.id)));
    if (!changed) return;
    const id = Number(changed.id.replace('i', ''));
    const isNew = !previous.some(item => item.id === changed.id);
    const payload = { nombre: changed.nombre, descripcion: '', idUnidadDeMedida: 1, stockActual: changed.stockActual, stockMinimo: changed.stockMinimo, costoUnitario: changed.costoUnitario, proveedor: changed.proveedor };
    void fetch(!isNew ? `/api/insumos/${id}` : '/api/insumos', { method: !isNew ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
  };

  const addRemito = async (r: Remito) => {
    try {
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
      const clientsResponse = await fetch('/api/clientes', { headers });
      const clients = clientsResponse.ok ? await clientsResponse.json() : [];
      let client = clients.find((item: any) => item.nombre === r.clienteNombre);
      if (!client) {
        const clientResponse = await fetch('/api/clientes', { method: 'POST', headers, body: JSON.stringify({ nombre: r.clienteNombre, descripcion: 'Cliente creado desde remito', direccion: r.clienteDireccion, correoElectronico: `cliente${Date.now()}@demo.local`, numeroDeTelefono: r.clienteTelefono || 'Sin teléfono', idProvincia: 1 }) });
        if (!clientResponse.ok) {
          const body = await clientResponse.text();
          console.error('No se pudo crear el cliente:', body);
          return null;
        }
        client = await clientResponse.json();
      }

      const response = await fetch('/api/remitos', { method: 'POST', headers, body: JSON.stringify({ fechaEntrega: `${r.fecha}T10:00:00.000Z`, horaEntrega: `${r.fecha}T10:00:00.000Z`, idEstado: estadoToId[r.estado], idCliente: client.idCliente, idResponsableEntrega: r.viajanteId ? Number(r.viajanteId.replace('u', '')) : undefined, observacion: r.observaciones, detalles: r.items.map(item => ({ idProducto: Number(item.productoId.replace('p', '')), cantidad: item.cantidad })) }) });

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
      currentUser, login, logout, usuarios,
      remitos, setRemitos, addRemito, updateRemito,
      productos, setProductos,
      insumos, setInsumos,
      recetas, setRecetas,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
