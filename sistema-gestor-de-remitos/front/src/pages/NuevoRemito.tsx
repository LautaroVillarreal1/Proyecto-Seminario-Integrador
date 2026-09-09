import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { Remito, RemitoItem } from '../types';

export default function NuevoRemito() {
  const navigate = useNavigate();
  const { productos, usuarios, addRemito, currentUser } = useApp();
  const viajantes = usuarios.filter(u => u.rol === 'viajante' && u.activo);

  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteDireccion, setClienteDireccion] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [viajanteId, setViajanteId] = useState('');
  const [descuento, setDescuento] = useState(0);
  const [observaciones, setObservaciones] = useState('');
  const [items, setItems] = useState<RemitoItem[]>([]);
  const [productoSelId, setProductoSelId] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [errors, setErrors] = useState<string[]>([]);

  const addItem = () => {
    const prod = productos.find(p => p.id === productoSelId);
    if (!prod) return;
    const existing = items.find(i => i.productoId === prod.id);
    if (existing) {
      setItems(items.map(i => i.productoId === prod.id
        ? { ...i, cantidad: i.cantidad + cantidad, subtotal: (i.cantidad + cantidad) * i.precioUnitario }
        : i
      ));
    } else {
      setItems([...items, {
        productoId: prod.id, productoNombre: prod.nombre,
        cantidad, precioUnitario: prod.precioVenta, subtotal: cantidad * prod.precioVenta,
      }]);
    }
    setProductoSelId('');
    setCantidad(1);
  };

  const removeItem = (productoId: string) => setItems(items.filter(i => i.productoId !== productoId));

  const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
  const total = subtotal - descuento;
  const fmt = (n: number) => `$${n.toLocaleString('es-AR')}`;

  const handleSubmit = (estado: 'borrador' | 'pendiente') => {
    const errs: string[] = [];
    if (!clienteNombre.trim()) errs.push('Nombre del cliente requerido');
    if (!clienteDireccion.trim()) errs.push('Dirección requerida');
    if (items.length === 0) errs.push('Debe agregar al menos un producto');
    if (errs.length > 0) { setErrors(errs); return; }

    const viajante = viajantes.find(v => v.id === viajanteId);
    const newRemito: Remito = {
      id: `rem${Date.now()}`,
      numero: `R-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`,
      fecha: new Date().toISOString().split('T')[0],
      clienteNombre: clienteNombre.trim(),
      clienteDireccion: clienteDireccion.trim(),
      clienteTelefono: clienteTelefono.trim() || undefined,
      viajanteId: viajanteId || undefined,
      viajanteNombre: viajante?.nombre,
      items,
      subtotal,
      descuento,
      total,
      estado,
      observaciones: observaciones.trim() || undefined,
      creadoPor: currentUser?.id || 'u1',
    };
    addRemito(newRemito);
    navigate(`/remitos/${newRemito.id}`);
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)}
        className="text-sm mb-6 flex items-center gap-1 transition-opacity hover:opacity-70"
        style={{ color: 'var(--color-muted-foreground)' }}>
        ← Volver
      </button>
      <h1 className="text-3xl font-bold mb-8" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}>
        Nuevo remito
      </h1>

      {errors.length > 0 && (
        <div className="mb-6 p-4 rounded-xl border text-sm space-y-1"
          style={{ background: '#FEE2E2', borderColor: '#FCA5A5', color: '#991B1B' }}>
          {errors.map(e => <p key={e}>• {e}</p>)}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Cliente */}
          <section className="rounded-2xl border p-5" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--color-muted-foreground)' }}>
              Datos del cliente
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Nombre *</label>
                <input value={clienteNombre} onChange={e => setClienteNombre(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
                  placeholder="Nombre del cliente o negocio" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Dirección *</label>
                <input value={clienteDireccion} onChange={e => setClienteDireccion(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
                  placeholder="Calle, número, localidad" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Teléfono</label>
                <input value={clienteTelefono} onChange={e => setClienteTelefono(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
                  placeholder="Opcional" />
              </div>
            </div>
          </section>

          {/* Productos */}
          <section className="rounded-2xl border p-5" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--color-muted-foreground)' }}>
              Productos
            </h2>
            {/* Add item */}
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
              <input
                type="number"
                min={1}
                value={cantidad}
                onChange={e => setCantidad(Math.max(1, Number(e.target.value)))}
                className="w-20 px-3 py-2 rounded-xl border text-sm outline-none text-center"
                style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
              />
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
                      <td className="px-3 py-2.5 font-medium" style={{ color: 'var(--color-foreground)' }}>{item.productoNombre}</td>
                      <td className="px-3 py-2.5 font-mono text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{item.cantidad}</td>
                      <td className="px-3 py-2.5 font-mono text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{fmt(item.precioUnitario)}</td>
                      <td className="px-3 py-2.5 font-mono text-xs font-semibold" style={{ color: 'var(--color-foreground)' }}>{fmt(item.subtotal)}</td>
                      <td className="px-3 py-2.5">
                        <button onClick={() => removeItem(item.productoId)} className="text-xs hover:opacity-70" style={{ color: '#B5392A' }}>✕</button>
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

          {/* Observaciones */}
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

        {/* Right */}
        <div className="space-y-5">
          {/* Viajante */}
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

          {/* Totales */}
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
                  value={descuento}
                  onChange={e => setDescuento(Math.max(0, Number(e.target.value)))}
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

          {/* Acciones */}
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
