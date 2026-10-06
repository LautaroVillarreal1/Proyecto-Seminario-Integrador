import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import ProductNameButton from '../components/ProductNameButton';
import type { Remito, RemitoItem } from '../types';

const normalizeText = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toLowerCase();
const normalizePhone = (value: string) => value.replace(/\D/g, '');

export default function NuevoRemito() {
  const navigate = useNavigate();
  const { productos, usuarios, clientes, provincias, addCliente, addRemito, currentUser } = useApp();
  const viajantes = usuarios.filter(u => u.rol === 'viajante' && u.activo);

  const [clienteId, setClienteId] = useState<number | null>(null);
  const [clienteSearch, setClienteSearch] = useState('');
  const [clienteDropdownOpen, setClienteDropdownOpen] = useState(false);
  const clientePickerRef = useRef<HTMLDivElement>(null);
  const [showClienteForm, setShowClienteForm] = useState(false);
  const [clienteSaving, setClienteSaving] = useState(false);
  const [clienteError, setClienteError] = useState('');
  const [clienteForm, setClienteForm] = useState({ nombre: '', descripcion: '', ciudad: '', calle: '', numero: '', correoElectronico: '', numeroDeTelefono: '', idProvincia: '' });
  const [viajanteId, setViajanteId] = useState('');
  const [descuento, setDescuento] = useState<number | undefined>(0);
  const [observaciones, setObservaciones] = useState('');
  const [items, setItems] = useState<RemitoItem[]>([]);
  const [productoSelId, setProductoSelId] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!clientePickerRef.current?.contains(event.target as Node)) {
        setClienteDropdownOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  const selectedCliente = clientes.find(cliente => cliente.idCliente === clienteId);
  const filteredClientes = clientes.filter(cliente => {
    const query = normalizeText(clienteSearch);
    return !query || normalizeText(`${cliente.nombre} ${cliente.correoElectronico} ${cliente.direccion} ${cliente.provincia?.nombre ?? ''}`).includes(query);
  });

  const addItem = () => {
    const prod = productos.find(p => p.id === productoSelId);
    if (!prod) return;

    const existing = items.find(i => i.productoId === prod.id);
    if (existing) {
      const next = items.map(i => i.productoId === prod.id
        ? { ...i, cantidad: i.cantidad + 1, subtotal: (i.cantidad + 1) * i.precioUnitario }
        : i
      );
      setItems(next);
    } else {
      setItems([...items, {
        productoId: prod.id,
        productoNombre: prod.nombre,
        cantidad: 1,
        precioUnitario: prod.precioVenta,
        subtotal: prod.precioVenta,
      }]);
    }
    setProductoSelId('');
  };

  const updateQuantity = (productoId: string, nextQuantity: number) => {
    const cantidadClamped = Math.max(1, nextQuantity);
    setItems(items.map(item => item.productoId === productoId
      ? { ...item, cantidad: cantidadClamped, subtotal: cantidadClamped * item.precioUnitario }
      : item
    ));
  };

  const removeItem = (productoId: string) => setItems(items.filter(i => i.productoId !== productoId));

  const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
  const total = subtotal - (descuento ?? 0);
  const fmt = (n: number) => `$${n.toLocaleString('es-AR')}`;

  const handleCreateCliente = async () => {
    setClienteError('');
    const nombre = clienteForm.nombre.trim();
    const ciudad = clienteForm.ciudad.trim();
    const calle = clienteForm.calle.trim();
    const numero = clienteForm.numero.trim();
    const correoElectronico = clienteForm.correoElectronico.trim().toLowerCase();
    const numeroDeTelefono = clienteForm.numeroDeTelefono.trim();
    const direccion = `${calle} ${numero}, ${ciudad}`;

    if (!nombre || !ciudad || !calle || !numero || !correoElectronico || !numeroDeTelefono || !clienteForm.idProvincia) {
      setClienteError('Completá nombre, ciudad, calle, número, correo, teléfono y provincia.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoElectronico)) {
      setClienteError('Ingresá un correo electrónico válido.');
      return;
    }
    if (clienteForm.descripcion.trim().length > 400) {
      setClienteError('La descripción no puede superar los 400 caracteres.');
      return;
    }
    const duplicate = clientes.some(cliente =>
      normalizeText(cliente.correoElectronico) === normalizeText(correoElectronico) ||
      (normalizePhone(numeroDeTelefono).length > 0 && normalizePhone(cliente.numeroDeTelefono) === normalizePhone(numeroDeTelefono)) ||
      (normalizeText(cliente.nombre) === normalizeText(nombre) && normalizeText(cliente.direccion) === normalizeText(direccion)),
    );
    if (duplicate) {
      setClienteError('Ya existe un cliente con el mismo correo, teléfono o nombre y dirección.');
      return;
    }

    setClienteSaving(true);
    const created = await addCliente({
      nombre,
      descripcion: clienteForm.descripcion.trim(),
      direccion,
      correoElectronico,
      numeroDeTelefono,
      idProvincia: Number(clienteForm.idProvincia),
    });
    setClienteSaving(false);
    if (!created) {
      setClienteError('No se pudo crear el cliente. Revisá los datos e intentá nuevamente.');
      return;
    }
    setClienteId(created.idCliente);
    setClienteSearch(created.nombre);
    setClienteDropdownOpen(false);
    setShowClienteForm(false);
    setClienteForm({ nombre: '', descripcion: '', ciudad: '', calle: '', numero: '', correoElectronico: '', numeroDeTelefono: '', idProvincia: '' });
  };

  const handleSubmit = async (estado: 'borrador' | 'pendiente') => {
    const errs: string[] = [];
    const cliente = clientes.find(item => item.idCliente === clienteId);
    if (!cliente) errs.push('Seleccioná un cliente.');
    if (!viajanteId.trim()) errs.push('Es necesario asignar viajante');
    if (items.length === 0) errs.push('Debe agregar al menos un producto');
    if (errs.length > 0) { setErrors(errs); return; }

    const viajante = viajantes.find(v => v.id === viajanteId);
    const newRemito: Remito = {
      id: `rem${Date.now()}`,
      numero: `R-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`,
      fecha: new Date().toISOString().split('T')[0],
      clienteId: cliente!.idCliente,
      clienteNombre: cliente!.nombre,
      clienteDireccion: cliente!.direccion,
      clienteTelefono: cliente!.numeroDeTelefono,
      viajanteId: viajanteId || undefined,
      viajanteNombre: viajante?.nombre,
      items,
      subtotal,
      descuento: descuento ?? 0,
      total,
      estado,
      observaciones: observaciones.trim() || undefined,
      creadoPor: currentUser?.id || 'u1',
    };

    try {
      const created = await addRemito(newRemito);
      if (!created) {
        setErrors(['No se pudo guardar el remito en el servidor.']);
        return;
      }
      navigate(`/remitos/${created.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo guardar el remito en el servidor.';
      setErrors([message]);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)}
        className="text-sm mb-6 flex items-center gap-1 transition-opacity hover:opacity-70"
        style={{ color: 'var(--color-muted-foreground)' }}>
        ← Volver
      </button>
      <h1 className="text-3xl font-bold mb-8" style={{ fontFamily: "'Baloo 2', 'Inter', sans-serif", color: 'var(--color-foreground)' }}>
        Nuevo remito
      </h1>

      {errors.length > 0 && (
        <div className="mb-6 p-4 rounded-xl border text-sm space-y-1"
          style={{ background: '#FEE2E2', borderColor: '#FCA5A5', color: '#991B1B' }}>
          {errors.map(e => <p key={e}>{e}</p>)}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <section className="rounded-2xl border p-5" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--color-muted-foreground)' }}>
              Datos del cliente
            </h2>
            <div className="flex flex-col sm:flex-row gap-2">
              <div ref={clientePickerRef} className="relative flex-1">
                <input
                  role="combobox"
                  aria-label="Buscar y seleccionar cliente"
                  aria-expanded={clienteDropdownOpen}
                  aria-controls="clientes-options"
                  autoComplete="off"
                  value={clienteSearch}
                  onFocus={() => setClienteDropdownOpen(true)}
                  onChange={event => { setClienteSearch(event.target.value); setClienteId(null); setClienteDropdownOpen(true); }}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
                  placeholder="Buscar por nombre, correo o dirección" />
                {clienteDropdownOpen && (
                  <div id="clientes-options" role="listbox" className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border shadow-lg" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    {filteredClientes.length > 0 ? filteredClientes.slice(0, 8).map(cliente => (
                      <button key={cliente.idCliente} type="button" role="option" aria-selected={cliente.idCliente === clienteId}
                        onClick={() => { setClienteId(cliente.idCliente); setClienteSearch(cliente.nombre); setClienteDropdownOpen(false); }}
                        className="block w-full px-3 py-2.5 text-left text-sm hover:bg-[var(--color-muted)]">
                        <span className="block font-medium" style={{ color: 'var(--color-foreground)' }}>{cliente.nombre}</span>
                        <span className="block text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{cliente.direccion} · {cliente.provincia?.nombre ?? 'Provincia sin datos'}</span>
                      </button>
                    )) : <p className="px-3 py-3 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>No hay clientes que coincidan.</p>}
                  </div>
                )}
              </div>
              <button type="button" onClick={() => { setShowClienteForm(value => !value); setClienteError(''); }}
                className="shrink-0 px-4 py-2.5 rounded-xl border text-sm font-semibold"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)', background: 'var(--color-card)' }}>
                + Nuevo cliente
              </button>
            </div>
            {selectedCliente && !showClienteForm && (
              <div className="mt-3 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                <p className="font-medium" style={{ color: 'var(--color-foreground)' }}>{selectedCliente.nombre}</p>
                <p>{selectedCliente.direccion} · {selectedCliente.provincia?.nombre ?? 'Provincia sin datos'}</p>
                <p>{selectedCliente.correoElectronico} · {selectedCliente.numeroDeTelefono}</p>
              </div>
            )}
            {showClienteForm && (
              <div className="mt-5 border-t pt-4 space-y-3" style={{ borderColor: 'var(--color-border)' }}>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>Nuevo cliente</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="text-xs font-medium" style={{ color: 'var(--color-foreground)' }}>Nombre *
                    <input value={clienteForm.nombre} onChange={e => setClienteForm({ ...clienteForm, nombre: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl border text-sm outline-none" style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }} />
                  </label>
                  <label className="text-xs font-medium" style={{ color: 'var(--color-foreground)' }}>Correo electrónico *
                    <input type="email" value={clienteForm.correoElectronico} onChange={e => setClienteForm({ ...clienteForm, correoElectronico: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl border text-sm outline-none" style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }} />
                  </label>
                  <label className="text-xs font-medium" style={{ color: 'var(--color-foreground)' }}>Teléfono *
                    <input type="tel" value={clienteForm.numeroDeTelefono} onChange={e => setClienteForm({ ...clienteForm, numeroDeTelefono: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl border text-sm outline-none" style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }} />
                  </label>
                  <label className="text-xs font-medium" style={{ color: 'var(--color-foreground)' }}>Provincia *
                    <select value={clienteForm.idProvincia} onChange={e => setClienteForm({ ...clienteForm, idProvincia: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl border text-sm outline-none" style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}>
                      <option value="">Seleccionar provincia</option>
                      {provincias.map(provincia => <option key={provincia.idProvincia} value={provincia.idProvincia}>{provincia.nombre}</option>)}
                    </select>
                  </label>
                  <label className="text-xs font-medium" style={{ color: 'var(--color-foreground)' }}>Ciudad *
                    <input value={clienteForm.ciudad} onChange={e => setClienteForm({ ...clienteForm, ciudad: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl border text-sm outline-none" style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }} />
                  </label>
                  <div className="grid grid-cols-[1fr_7rem] gap-2">
                    <label className="text-xs font-medium" style={{ color: 'var(--color-foreground)' }}>Calle *
                      <input value={clienteForm.calle} onChange={e => setClienteForm({ ...clienteForm, calle: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl border text-sm outline-none" style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }} />
                    </label>
                    <label className="text-xs font-medium" style={{ color: 'var(--color-foreground)' }}>Número *
                      <input value={clienteForm.numero} onChange={e => setClienteForm({ ...clienteForm, numero: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl border text-sm outline-none" style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }} />
                    </label>
                  </div>
                  <label className="text-xs font-medium sm:col-span-2" style={{ color: 'var(--color-foreground)' }}>Descripción (opcional, hasta 400 caracteres)
                    <textarea maxLength={400} rows={2} value={clienteForm.descripcion} onChange={e => setClienteForm({ ...clienteForm, descripcion: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl border text-sm outline-none resize-y" style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }} />
                  </label>
                </div>
                {clienteError && <p role="alert" className="text-sm" style={{ color: '#B42318' }}>{clienteError}</p>}
                <div className="flex gap-2">
                  <button type="button" onClick={handleCreateCliente} disabled={clienteSaving} className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50" style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>{clienteSaving ? 'Guardando...' : 'Guardar cliente'}</button>
                  <button type="button" onClick={() => { setShowClienteForm(false); setClienteError(''); }} className="px-4 py-2 rounded-xl border text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}>Cancelar</button>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-2xl border p-5" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--color-muted-foreground)' }}>
              Productos
            </h2>
            <div className="flex gap-2 mb-4">
              <select
                value={productoSelId}
                onChange={e => setProductoSelId(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border text-sm outline-none"
                style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}>
                <option value="">Seleccionar producto</option>
                {productos.filter(p => p.activo).map(p => (
                  <option key={p.id} value={p.id}>{p.nombre} — ${p.precioVenta}</option>
                ))}
              </select>
              <button
                onClick={addItem}
                disabled={!productoSelId}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
                style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
                +
              </button>
            </div>

            {items.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--color-muted)' }}>
                    {['Producto', 'Cant.', 'P. unit.', 'Subtotal', ''].map(h => (
                      <th key={h} className="text-left px-3 py-2 text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.productoId} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                      <td className="px-3 py-2.5 font-medium" style={{ color: 'var(--color-foreground)' }}><ProductNameButton productId={item.productoId}>{item.productoNombre}</ProductNameButton></td>
                      <td className="px-3 py-2.5 font-mono text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                        <span className="inline-flex items-center gap-2">
                          <button className="px-2 py-1 rounded border" style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }} onClick={() => updateQuantity(item.productoId, item.cantidad - 1)}>-</button>
                          <span>{item.cantidad}</span>
                          <button className="px-2 py-1 rounded border" style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }} onClick={() => updateQuantity(item.productoId, item.cantidad + 1)}>+</button>
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{fmt(item.precioUnitario)}</td>
                      <td className="px-3 py-2.5 font-mono text-xs font-semibold" style={{ color: 'var(--color-foreground)' }}>{fmt(item.subtotal)}</td>
                      <td className="px-3 py-2.5">
                        <button onClick={() => removeItem(item.productoId)} className="text-xs hover:opacity-70" style={{ color: '#E53935' }}>Quitar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-center py-6 italic" style={{ color: 'var(--color-muted-foreground)' }}>
                Sin productos aún
              </p>
            )}
          </section>

          <section className="rounded-2xl border p-5" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--color-muted-foreground)' }}>
              Observaciones
            </h2>
            <textarea
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              rows={3}
              placeholder="Notas internas, instrucciones de entrega…"
              className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none"
              style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
            />
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-2xl border p-5" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--color-muted-foreground)' }}>
              Asignar viajante
            </h2>
            <select
              value={viajanteId}
              onChange={e => setViajanteId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
              style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}>
              <option value="">Sin asignar</option>
              {viajantes.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
            </select>
          </section>

          <section className="rounded-2xl border p-5" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--color-muted-foreground)' }}>
              Total
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between" style={{ color: 'var(--color-muted-foreground)' }}>
                <span>Subtotal</span>
                <span className="font-mono text-xs">{fmt(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--color-muted-foreground)' }}>Descuento</span>
                <input
                  type="number"
                  min={0}
                  value={descuento ?? ''}
                  onChange={e => setDescuento(e.target.value === '' ? undefined : Math.max(0, Number(e.target.value)))}
                  className="w-24 px-2 py-1 rounded-lg border text-xs text-right font-mono outline-none"
                  style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
                />
              </div>
              <div className="flex justify-between text-base font-bold pt-2 border-t" style={{ color: 'var(--color-foreground)', borderColor: 'var(--color-border)' }}>
                <span>Total</span>
                <span className="font-mono">{fmt(total)}</span>
              </div>
            </div>
          </section>

          <div className="space-y-2">
            <button
              onClick={() => handleSubmit('pendiente')}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
              Crear y confirmar
            </button>
            <button
              onClick={() => handleSubmit('borrador')}
              className="w-full py-3 rounded-xl text-sm font-medium border transition-colors hover:opacity-80"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)', background: 'var(--color-card)' }}>
              Guardar borrador
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
