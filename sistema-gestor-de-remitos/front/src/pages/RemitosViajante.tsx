import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { EstadoBadge } from '../components/Badge';
import type { EstadoRemito } from '../types';

const ESTADO_ORDER: EstadoRemito[] = ['en_camino', 'pendiente', 'con_inconveniente', 'entregado', 'cancelado'];

const FILTROS: { value: string; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_camino', label: 'En camino' },
  { value: 'entregado', label: 'Entregado' },
  { value: 'con_inconveniente', label: 'Inconveniente' },
];

const ESTADO_BG: Partial<Record<EstadoRemito, string>> = {
  en_camino:        'border-l-[#1F6FAE]',
  pendiente:        'border-l-[#C4761E]',
  con_inconveniente:'border-l-[#B5392A]',
  entregado:        'border-l-[#2B6B2B]',
  borrador:         'border-l-[#8C8C7A]',
  cancelado:        'border-l-[#555550]',
};

export default function RemitosViajante() {
  const { remitos, currentUser } = useApp();
  const navigate = useNavigate();
  const [filtro, setFiltro] = useState('');
  const [search, setSearch] = useState('');

  const misRemitos = remitos
    .filter(r => r.viajanteId === currentUser?.id)
    .filter(r => !filtro || r.estado === filtro)
    .filter(r =>
      !search ||
      r.clienteNombre.toLowerCase().includes(search.toLowerCase()) ||
      r.numero.toLowerCase().includes(search.toLowerCase()) ||
      r.clienteDireccion.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const ai = ESTADO_ORDER.indexOf(a.estado as EstadoRemito);
      const bi = ESTADO_ORDER.indexOf(b.estado as EstadoRemito);
      if (ai !== bi) return ai - bi;
      return b.fecha.localeCompare(a.fecha);
    });

  const pendientesCount = remitos.filter(r => r.viajanteId === currentUser?.id && (r.estado === 'pendiente' || r.estado === 'en_camino')).length;
  const entregadosHoy = (() => {
    const hoy = new Date().toISOString().split('T')[0];
    return remitos.filter(r => r.viajanteId === currentUser?.id && r.estado === 'entregado' && r.fechaEntrega === hoy).length;
  })();

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b" style={{ background: 'var(--color-sidebar)', borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="px-4 pt-5 pb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(168,200,150,0.7)' }}>
              LácteosNaturales
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'rgba(196,118,30,0.2)', color: '#E8A84E' }}>
              Viajante
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
            Mis remitos
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(168,200,150,0.7)' }}>
            {currentUser?.nombre}
          </p>
        </div>

        {/* Stats strip */}
        <div className="flex border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="flex-1 text-center py-3 border-r" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>{pendientesCount}</div>
            <div className="text-xs mt-0.5" style={{ color: 'rgba(168,200,150,0.6)' }}>pendientes</div>
          </div>
          <div className="flex-1 text-center py-3">
            <div className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>{entregadosHoy}</div>
            <div className="text-xs mt-0.5" style={{ color: 'rgba(168,200,150,0.6)' }}>entregados hoy</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pt-4 pb-2">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>🔍</span>
          <input
            type="search"
            placeholder="Buscar cliente o dirección…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-3 rounded-2xl border text-sm outline-none"
            style={{
              background: 'var(--color-card)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-foreground)',
            }}
          />
        </div>
      </div>

      {/* Filtro chips */}
      <div className="flex gap-2 px-4 py-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {FILTROS.map(f => (
          <button
            key={f.value}
            onClick={() => setFiltro(f.value)}
            className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all"
            style={{
              background: filtro === f.value ? 'var(--color-primary)' : 'var(--color-card)',
              borderColor: filtro === f.value ? 'var(--color-primary)' : 'var(--color-border)',
              color: filtro === f.value ? 'var(--color-primary-foreground)' : 'var(--color-foreground)',
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="px-4 pt-2 pb-24 space-y-3">
        {misRemitos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="font-semibold" style={{ color: 'var(--color-foreground)' }}>
              {search || filtro ? 'Sin resultados' : 'Sin remitos asignados'}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
              {search || filtro ? 'Probá con otro filtro' : 'Te avisamos cuando te asignen uno'}
            </p>
          </div>
        ) : (
          misRemitos.map(r => {
            const activo = r.estado === 'en_camino' || r.estado === 'pendiente' || r.estado === 'con_inconveniente';
            const borderColor = ESTADO_BG[r.estado as EstadoRemito] || 'border-l-gray-300';
            return (
              <button
                key={r.id}
                onClick={() => navigate(`/remitos/${r.id}`)}
                className={`w-full text-left rounded-2xl border border-l-4 overflow-hidden transition-all active:scale-[0.98] ${borderColor}`}
                style={{
                  background: 'var(--color-card)',
                  borderColor: 'var(--color-border)',
                  borderLeftColor: undefined, // handled by Tailwind class above
                  boxShadow: activo ? '0 2px 12px rgba(0,0,0,0.08)' : 'none',
                }}>
                <div className="px-4 pt-4 pb-3">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-base leading-tight truncate" style={{ color: 'var(--color-foreground)' }}>
                        {r.clienteNombre}
                      </div>
                      <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-muted-foreground)' }}>
                        📍 {r.clienteDireccion}
                      </div>
                    </div>
                    <EstadoBadge estado={r.estado as EstadoRemito} />
                  </div>

                  {/* Products summary */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {r.items.map((item, i) => (
                      <span key={i}
                        className="text-xs px-2.5 py-1 rounded-lg font-medium"
                        style={{ background: 'var(--color-muted)', color: 'var(--color-foreground)' }}>
                        {item.cantidad}× {item.productoNombre.replace(/\s\d+g$|\s\d+ml$/, '')}
                      </span>
                    ))}
                  </div>

                  {/* Footer row */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                      {r.numero}
                    </span>
                    <div className="flex items-center gap-3">
                      {r.clienteTelefono && (
                        <a
                          href={`tel:${r.clienteTelefono}`}
                          onClick={e => e.stopPropagation()}
                          className="text-xs font-medium flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-colors active:opacity-70"
                          style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}>
                          📞 Llamar
                        </a>
                      )}
                      <span className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>›</span>
                    </div>
                  </div>
                </div>

                {/* CTA bar for active remitos */}
                {(r.estado === 'pendiente' || r.estado === 'en_camino') && (
                  <div className="px-4 py-2.5 border-t flex items-center justify-between"
                    style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)' }}>
                    <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                      {r.estado === 'pendiente' ? 'Listo para salir' : 'En camino al cliente'}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>
                      {r.estado === 'pendiente' ? 'Iniciar entrega →' : 'Registrar entrega →'}
                    </span>
                  </div>
                )}
                {r.estado === 'con_inconveniente' && (
                  <div className="px-4 py-2.5 border-t flex items-center justify-between"
                    style={{ background: '#FFF5F5', borderColor: '#FCA5A5' }}>
                    <span className="text-xs" style={{ color: '#B5392A' }}>
                      ⚠ {r.inconveniente ? r.inconveniente.slice(0, 50) + (r.inconveniente.length > 50 ? '…' : '') : 'Con inconveniente'}
                    </span>
                  </div>
                )}
                {r.estado === 'entregado' && (
                  <div className="px-4 py-2 border-t flex items-center gap-2"
                    style={{ background: 'rgba(43,107,43,0.05)', borderColor: 'rgba(43,107,43,0.15)' }}>
                    <span className="text-xs" style={{ color: '#2B6B2B' }}>
                      ✓ Entregado {r.horaEntrega ? `a las ${r.horaEntrega}` : ''}
                      {r.formaPago ? ` · ${r.formaPago.replace('_', ' ')}` : ''}
                    </span>
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
