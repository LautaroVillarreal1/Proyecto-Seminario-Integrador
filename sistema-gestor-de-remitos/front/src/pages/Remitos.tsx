import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { EstadoBadge } from '../components/Badge';
import type { EstadoRemito } from '../types';

const ESTADOS: { value: string; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'borrador', label: 'Borrador' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_camino', label: 'En camino' },
  { value: 'entregado', label: 'Entregado' },
  { value: 'con_inconveniente', label: 'Con inconveniente' },
  { value: 'cancelado', label: 'Cancelado' },
];

export default function Remitos() {
  const { remitos, currentUser } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState(searchParams.get('estado') || '');

  const isViajante = currentUser?.rol === 'viajante';

  let filtered = remitos;
  if (isViajante) filtered = filtered.filter(r =>
    r.viajanteId === currentUser?.id && !(r.observaciones?.startsWith('Falta:\n') && !['en_camino', 'entregado', 'con_inconveniente'].includes(r.estado))
  );
  if (estadoFiltro) filtered = filtered.filter(r => r.estado === estadoFiltro);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(r =>
      r.numero.toLowerCase().includes(q) ||
      r.clienteNombre.toLowerCase().includes(q) ||
      r.clienteDireccion.toLowerCase().includes(q)
    );
  }

  filtered = [...filtered].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.numero.localeCompare(a.numero));

  const fmt = (n: number) => `$${n.toLocaleString('es-AR')}`;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "'Baloo 2', 'Inter', sans-serif", color: 'var(--color-foreground)' }}>
            {isViajante ? 'Mis Remitos' : 'Remitos'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
            {filtered.length} remito{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        {!isViajante && (
          <button
            onClick={() => navigate('/remitos/nuevo')}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 flex items-center gap-2"
            style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
            <span>+</span> Nuevo remito
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Buscar por número, cliente…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-3 py-2.5 rounded-xl border text-sm outline-none"
          style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
        />
        <select
          value={estadoFiltro}
          onChange={e => setEstadoFiltro(e.target.value)}
          className="px-3 py-2.5 rounded-xl border text-sm outline-none"
          style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}>
          {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--color-muted)' }}>
                {['Número', 'Fecha', 'Cliente', 'Dirección', !isViajante && 'Viajante', 'Total', 'Estado', ''].filter(Boolean).map(h => (
                  <th key={h as string} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                    style={{ color: 'var(--color-muted-foreground)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                    No se encontraron remitos
                  </td>
                </tr>
              ) : filtered.map(r => (
                <tr key={r.id}
                  className="border-t cursor-pointer transition-colors hover:bg-[var(--color-muted)]"
                  style={{ borderColor: 'var(--color-border)' }}
                  onClick={() => navigate(`/remitos/${r.id}`)}>
                  <td className="px-4 py-3 font-mono text-xs font-medium whitespace-nowrap" style={{ color: 'var(--color-primary)' }}>
                    {r.numero}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--color-muted-foreground)' }}>
                    {new Date(r.fecha + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-foreground)' }}>
                    {r.clienteNombre}
                  </td>
                  <td className="px-4 py-3 max-w-[180px] truncate" style={{ color: 'var(--color-muted-foreground)' }}>
                    {r.clienteDireccion}
                  </td>
                  {!isViajante && (
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--color-muted-foreground)' }}>
                      {r.viajanteNombre || <span className="italic opacity-50">Sin asignar</span>}
                    </td>
                  )}
                  <td className="px-4 py-3 font-mono text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--color-foreground)' }}>
                    {fmt(r.total)}
                  </td>
                  <td className="px-4 py-3">
                    <EstadoBadge estado={r.estado as EstadoRemito} />
                    {r.estado === 'pendiente' && r.observaciones?.startsWith('Falta:\n') && (
                      <p className="mt-1 whitespace-pre-line text-xs" style={{ color: '#8A671F' }}>{r.observaciones}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>›</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
