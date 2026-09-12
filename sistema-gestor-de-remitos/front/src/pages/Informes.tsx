import { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { FormaPago, EstadoRemito } from '../types';

const FORMAS_PAGO: Record<FormaPago, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  cheque: 'Cheque',
  cuenta_corriente: 'Cta. cte.',
  tarjeta: 'Tarjeta',
};

export default function Informes() {
  const { remitos, usuarios } = useApp();
  const [tab, setTab] = useState<'entregas' | 'formas_pago' | 'viajantes' | 'ventas'>('entregas');
  const [desde, setDesde] = useState('2026-08-01');
  const [hasta, setHasta] = useState('2026-08-31');

  const filtrados = remitos.filter(r => r.fecha >= desde && r.fecha <= hasta);
  const entregados = filtrados.filter(r => r.estado === 'entregado');
  const fmt = (n: number) => `$${n.toLocaleString('es-AR')}`;

  // Entregas por estado
  const porEstado = (['borrador', 'pendiente', 'en_camino', 'entregado', 'con_inconveniente', 'cancelado'] as EstadoRemito[]).map(e => ({
    estado: e,
    cantidad: filtrados.filter(r => r.estado === e).length,
    total: filtrados.filter(r => r.estado === e).reduce((s, r) => s + r.total, 0),
  })).filter(e => e.cantidad > 0);

  const estadoLabel: Record<EstadoRemito, string> = {
    borrador: 'Borrador', pendiente: 'Pendiente', en_camino: 'En camino',
    entregado: 'Entregado', con_inconveniente: 'Con inconveniente', cancelado: 'Cancelado',
  };

  // Formas de pago
  const formasPagoData = Object.entries(FORMAS_PAGO).map(([key, label]) => {
    const rems = entregados.filter(r => r.formaPago === key);
    return { key, label, cantidad: rems.length, total: rems.reduce((s, r) => s + r.total, 0) };
  }).filter(f => f.cantidad > 0);

  // Por viajante
  const porViajante = usuarios.filter(u => u.rol === 'viajante').map(v => {
    const rems = filtrados.filter(r => r.viajanteId === v.id);
    const entregadosV = rems.filter(r => r.estado === 'entregado');
    return {
      nombre: v.nombre,
      asignados: rems.length,
      entregados: entregadosV.length,
      pendientes: rems.filter(r => r.estado === 'pendiente' || r.estado === 'en_camino').length,
      inconvenientes: rems.filter(r => r.estado === 'con_inconveniente').length,
      totalEntregado: entregadosV.reduce((s, r) => s + r.total, 0),
    };
  });

  // Ventas diarias
  const fechas: Record<string, number> = {};
  entregados.forEach(r => {
    const f = r.fechaEntrega || r.fecha;
    fechas[f] = (fechas[f] || 0) + r.total;
  });
  const ventasDiarias = Object.entries(fechas).sort(([a], [b]) => a.localeCompare(b));
  const maxVenta = Math.max(...ventasDiarias.map(([, v]) => v), 1);

  const totalPeriodo = entregados.reduce((s, r) => s + r.total, 0);
  const ticketPromedio = entregados.length > 0 ? totalPeriodo / entregados.length : 0;

  const TABS = [
    { id: 'entregas', label: 'Por estado' },
    { id: 'formas_pago', label: 'Forma de pago' },
    { id: 'viajantes', label: 'Por viajante' },
    { id: 'ventas', label: 'Ventas diarias' },
  ] as const;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ fontFamily: "'Baloo 2', 'Inter', sans-serif", color: 'var(--color-foreground)' }}>
          Informes
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
          Resumen del período seleccionado
        </p>
      </div>

      {/* Filtro fechas */}
      <div className="flex flex-wrap gap-4 mb-8 p-4 rounded-2xl border" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>Desde</label>
          <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
            className="px-3 py-2 rounded-xl border text-sm outline-none"
            style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>Hasta</label>
          <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
            className="px-3 py-2 rounded-xl border text-sm outline-none"
            style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }} />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total remitos', value: filtrados.length, sub: 'en el período' },
          { label: 'Entregados', value: entregados.length, sub: `${filtrados.length > 0 ? Math.round(entregados.length / filtrados.length * 100) : 0}% del total`, color: 'var(--color-primary)' },
          { label: 'Facturado', value: fmt(totalPeriodo), sub: 'entregas cobradas' },
          { label: 'Ticket promedio', value: fmt(Math.round(ticketPromedio)), sub: 'por remito entregado' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border p-5" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--color-muted-foreground)' }}>{s.label}</div>
            <div className="text-2xl font-bold" style={{ fontFamily: "'Baloo 2', 'Inter', sans-serif", color: s.color || 'var(--color-foreground)' }}>{s.value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--color-muted-foreground)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl border w-fit" style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: tab === t.id ? 'var(--color-card)' : 'transparent',
              color: tab === t.id ? 'var(--color-foreground)' : 'var(--color-muted-foreground)',
              boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
        {tab === 'entregas' && (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--color-muted)' }}>
                {['Estado', 'Cantidad', 'Total'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-muted-foreground)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {porEstado.length === 0 ? (
                <tr><td colSpan={3} className="px-5 py-10 text-center text-sm italic" style={{ color: 'var(--color-muted-foreground)' }}>Sin datos en el período</td></tr>
              ) : porEstado.map(e => (
                <tr key={e.estado} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-5 py-3 font-medium" style={{ color: 'var(--color-foreground)' }}>{estadoLabel[e.estado]}</td>
                  <td className="px-5 py-3 font-mono text-xs font-semibold" style={{ color: 'var(--color-foreground)' }}>{e.cantidad}</td>
                  <td className="px-5 py-3 font-mono text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{fmt(e.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'formas_pago' && (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--color-muted)' }}>
                {['Forma de pago', 'Remitos', 'Total cobrado'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-muted-foreground)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {formasPagoData.length === 0 ? (
                <tr><td colSpan={3} className="px-5 py-10 text-center text-sm italic" style={{ color: 'var(--color-muted-foreground)' }}>Sin entregas en el período</td></tr>
              ) : formasPagoData.map(f => (
                <tr key={f.key} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-5 py-3 font-medium" style={{ color: 'var(--color-foreground)' }}>{f.label}</td>
                  <td className="px-5 py-3 font-mono text-xs font-semibold" style={{ color: 'var(--color-foreground)' }}>{f.cantidad}</td>
                  <td className="px-5 py-3 font-mono text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>{fmt(f.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'viajantes' && (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--color-muted)' }}>
                {['Viajante', 'Asignados', 'Entregados', 'Pendientes', 'Inconvenientes', 'Total entregado'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: 'var(--color-muted-foreground)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {porViajante.map(v => (
                <tr key={v.nombre} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-foreground)' }}>{v.nombre}</td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{v.asignados}</td>
                  <td className="px-4 py-3 font-mono text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>{v.entregados}</td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: v.pendientes > 0 ? 'var(--color-accent)' : 'var(--color-muted-foreground)' }}>{v.pendientes}</td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: v.inconvenientes > 0 ? '#E53935' : 'var(--color-muted-foreground)' }}>{v.inconvenientes}</td>
                  <td className="px-4 py-3 font-mono text-xs font-semibold" style={{ color: 'var(--color-foreground)' }}>{fmt(v.totalEntregado)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'ventas' && (
          <div className="p-5">
            {ventasDiarias.length === 0 ? (
              <p className="text-center text-sm italic py-10" style={{ color: 'var(--color-muted-foreground)' }}>Sin ventas en el período</p>
            ) : (
              <div className="space-y-2">
                {ventasDiarias.map(([fecha, total]) => {
                  const pct = Math.round((total / maxVenta) * 100);
                  return (
                    <div key={fecha} className="flex items-center gap-4">
                      <span className="text-xs font-mono w-20 flex-shrink-0" style={{ color: 'var(--color-muted-foreground)' }}>
                        {new Date(fecha + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                      </span>
                      <div className="flex-1 h-7 rounded-lg overflow-hidden" style={{ background: 'var(--color-muted)' }}>
                        <div
                          className="h-full rounded-lg flex items-center px-3 transition-all"
                          style={{ width: `${pct}%`, background: 'var(--color-primary)', minWidth: 60 }}>
                          <span className="text-xs font-mono font-semibold" style={{ color: 'var(--color-primary-foreground)' }}>
                            {fmt(total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
