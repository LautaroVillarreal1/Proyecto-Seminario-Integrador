import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { EstadoBadge } from '../components/Badge';
import type { EstadoRemito, FormaPago } from '../types';

const FORMAS_PAGO: { value: FormaPago; label: string }[] = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'cuenta_corriente', label: 'Cuenta corriente' },
  { value: 'tarjeta', label: 'Tarjeta' },
];

const ESTADO_TRANSITIONS: Partial<Record<EstadoRemito, EstadoRemito[]>> = {
  borrador: ['pendiente', 'cancelado'],
  pendiente: ['en_camino', 'cancelado'],
  en_camino: ['entregado', 'con_inconveniente'],
  con_inconveniente: ['en_camino', 'entregado', 'cancelado'],
};

export default function RemitoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { remitos, updateRemito, currentUser, usuarios } = useApp();
  const remito = remitos.find(r => r.id === id);

  const [showEntregaForm, setShowEntregaForm] = useState(false);
  const [formaPago, setFormaPago] = useState<FormaPago>(remito?.formaPago || 'efectivo');
  const [observaciones, setObservaciones] = useState(remito?.observaciones || '');
  const [inconveniente, setInconveniente] = useState(remito?.inconveniente || '');
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (!remito) {
    return (
      <div className="p-8 text-center" style={{ color: 'var(--color-muted-foreground)' }}>
        Remito no encontrado.{' '}
        <button onClick={() => navigate('/remitos')} className="underline" style={{ color: 'var(--color-primary)' }}>
          Volver
        </button>
      </div>
    );
  }

  const isViajante = currentUser?.rol === 'viajante';
  const canMarkEntregado = remito.estado === 'en_camino' || remito.estado === 'con_inconveniente';
  const transitions = ESTADO_TRANSITIONS[remito.estado] || [];
  const fmt = (n: number) => `$${n.toLocaleString('es-AR')}`;

  const handleTransition = (newEstado: EstadoRemito) => {
    if (newEstado === 'cancelado' && !confirmCancel) {
      setConfirmCancel(true);
      return;
    }
    const now = new Date();
    updateRemito({
      ...remito,
      estado: newEstado,
      ...(newEstado === 'entregado' && {
        fechaEntrega: now.toISOString().split('T')[0],
        horaEntrega: now.toTimeString().slice(0, 5),
        formaPago,
        observaciones,
      }),
      ...(newEstado === 'con_inconveniente' && { inconveniente }),
    });
    setShowEntregaForm(false);
    setConfirmCancel(false);
  };

  const handleGuardarObservaciones = () => {
    updateRemito({ ...remito, observaciones, inconveniente });
  };

  const estadoLabel: Record<EstadoRemito, string> = {
    borrador: 'Borrador', pendiente: 'Pendiente', en_camino: 'En camino',
    entregado: 'Entregado', con_inconveniente: 'Con inconveniente', cancelado: 'Cancelado',
  };

  const transitionLabels: Partial<Record<EstadoRemito, string>> = {
    pendiente: 'Confirmar pedido',
    en_camino: 'Marcar en camino',
    entregado: 'Marcar como entregado',
    con_inconveniente: 'Reportar inconveniente',
    cancelado: 'Cancelar remito',
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <button
            onClick={() => isViajante ? navigate('/mis-remitos') : navigate(-1)}
            className="text-sm mb-3 flex items-center gap-1 transition-opacity hover:opacity-70"
            style={{ color: 'var(--color-muted-foreground)' }}>
            ← Volver
          </button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold" style={{ fontFamily: "'Baloo 2', 'Inter', sans-serif", color: 'var(--color-foreground)' }}>
              {remito.numero}
            </h1>
            <EstadoBadge estado={remito.estado as EstadoRemito} />
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
            Creado el {new Date(remito.fecha + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {!isViajante && remito.estado === 'borrador' && (
          <button
            onClick={() => navigate(`/remitos/${remito.id}/editar`)}
            className="px-4 py-2 rounded-xl text-sm font-medium border transition-colors hover:opacity-80"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}>
            Editar
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Cliente */}
          <section className="rounded-2xl border p-5" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--color-muted-foreground)' }}>
              Cliente
            </h2>
            <div className="space-y-1.5">
              <p className="font-semibold" style={{ color: 'var(--color-foreground)' }}>{remito.clienteNombre}</p>
              <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>{remito.clienteDireccion}</p>
              {remito.clienteTelefono && (
                <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>📞 {remito.clienteTelefono}</p>
              )}
            </div>
          </section>

          {/* Productos */}
          <section className="rounded-2xl border overflow-hidden" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-xs font-semibold uppercase tracking-widest px-5 py-4 border-b"
              style={{ color: 'var(--color-muted-foreground)', borderColor: 'var(--color-border)' }}>
              Productos
            </h2>
            {isViajante ? (
              /* Viajante: solo producto y cantidad, sin precios */
              <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                {remito.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-4">
                    <span className="font-medium text-sm" style={{ color: 'var(--color-foreground)' }}>
                      {item.productoNombre}
                    </span>
                    <span className="font-mono text-2xl font-bold ml-4 flex-shrink-0"
                      style={{ color: 'var(--color-primary)', fontFamily: "'Baloo 2', 'Inter', sans-serif" }}>
                      {item.cantidad}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'var(--color-muted)' }}>
                      {['Producto', 'Cant.', 'P. unit.', 'Subtotal'].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {remito.items.map((item, i) => (
                      <tr key={i} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                        <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-foreground)' }}>{item.productoNombre}</td>
                        <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{item.cantidad}</td>
                        <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{fmt(item.precioUnitario)}</td>
                        <td className="px-4 py-3 font-mono text-xs font-semibold" style={{ color: 'var(--color-foreground)' }}>{fmt(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="border-t px-4 py-3 space-y-1" style={{ borderColor: 'var(--color-border)' }}>
                  {remito.descuento > 0 && (
                    <>
                      <div className="flex justify-between text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                        <span>Subtotal</span><span className="font-mono text-xs">{fmt(remito.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                        <span>Descuento</span><span className="font-mono text-xs text-red-600">-{fmt(remito.descuento)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-base font-bold pt-1" style={{ color: 'var(--color-foreground)' }}>
                    <span>Total</span><span className="font-mono">{fmt(remito.total)}</span>
                  </div>
                </div>
              </>
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
              placeholder="Agregar observaciones…"
              className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none"
              style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
            />
            {remito.estado === 'con_inconveniente' && (
              <div className="mt-3">
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#E53935' }}>
                  Descripción del inconveniente
                </label>
                <textarea
                  value={inconveniente}
                  onChange={e => setInconveniente(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none"
                  style={{ background: '#FFF5F5', borderColor: '#FCA5A5', color: 'var(--color-foreground)' }}
                />
              </div>
            )}
            <button
              onClick={handleGuardarObservaciones}
              className="mt-3 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
              style={{ background: 'var(--color-secondary)', color: 'var(--color-secondary-foreground)' }}>
              Guardar notas
            </button>
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Viajante */}
          <section className="rounded-2xl border p-5" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--color-muted-foreground)' }}>
              Viajante
            </h2>
            {remito.viajanteNombre
              ? <p className="font-medium text-sm" style={{ color: 'var(--color-foreground)' }}>{remito.viajanteNombre}</p>
              : <p className="text-sm italic" style={{ color: 'var(--color-muted-foreground)' }}>Sin asignar</p>
            }
          </section>

          {/* Entrega */}
          {remito.estado === 'entregado' && (
            <section className="rounded-2xl border p-5" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
              <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--color-muted-foreground)' }}>
                Entrega
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-muted-foreground)' }}>Fecha</span>
                  <span style={{ color: 'var(--color-foreground)' }}>
                    {remito.fechaEntrega && new Date(remito.fechaEntrega + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-muted-foreground)' }}>Hora</span>
                  <span style={{ color: 'var(--color-foreground)' }}>{remito.horaEntrega}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-muted-foreground)' }}>Pago</span>
                  <span className="font-medium capitalize" style={{ color: 'var(--color-foreground)' }}>
                    {FORMAS_PAGO.find(f => f.value === remito.formaPago)?.label || remito.formaPago}
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* Acciones */}
          {(transitions.length > 0 || canMarkEntregado) && (
            <section className="rounded-2xl border p-5" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
              <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--color-muted-foreground)' }}>
                Acciones
              </h2>

              {/* Entrega form inline */}
              {showEntregaForm ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>
                      Forma de pago
                    </label>
                    <select
                      value={formaPago}
                      onChange={e => setFormaPago(e.target.value as FormaPago)}
                      className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                      style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}>
                      {FORMAS_PAGO.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>
                      Observaciones
                    </label>
                    <textarea
                      value={observaciones}
                      onChange={e => setObservaciones(e.target.value)}
                      rows={2}
                      placeholder="Opcional…"
                      className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none"
                      style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTransition('entregado')}
                      className="flex-1 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
                      style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
                      Confirmar entrega
                    </button>
                    <button
                      onClick={() => setShowEntregaForm(false)}
                      className="px-3 py-2 rounded-lg text-sm border transition-colors hover:opacity-70"
                      style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}>
                      Quitar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {transitions.map(estado => {
                    if (estado === 'entregado') {
                      return (
                        <button
                          key={estado}
                          onClick={() => setShowEntregaForm(true)}
                          className="w-full py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
                          style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
                          {transitionLabels[estado]}
                        </button>
                      );
                    }
                    const isCancelacion = estado === 'cancelado';
                    return (
                      <button
                        key={estado}
                        onClick={() => handleTransition(estado)}
                        className="w-full py-2 rounded-xl text-sm font-medium border transition-colors hover:opacity-80"
                        style={{
                          background: isCancelacion ? '#FEE2E2' : 'var(--color-secondary)',
                          borderColor: isCancelacion ? '#FCA5A5' : 'var(--color-border)',
                          color: isCancelacion ? '#991B1B' : 'var(--color-secondary-foreground)',
                        }}>
                        {confirmCancel && isCancelacion ? '¿Confirmar cancelación?' : transitionLabels[estado]}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
