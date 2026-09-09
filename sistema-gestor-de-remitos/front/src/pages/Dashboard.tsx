import { useNavigate, Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { EstadoBadge } from '../components/Badge';
import type { EstadoRemito } from '../types';

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="rounded-2xl p-5 border" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
      <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-muted-foreground)' }}>
        {label}
      </div>
      <div className="text-3xl font-bold leading-none" style={{ color: color || 'var(--color-foreground)', fontFamily: 'var(--font-display)' }}>
        {value}
      </div>
      {sub && <div className="text-xs mt-2" style={{ color: 'var(--color-muted-foreground)' }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { remitos, productos, insumos, currentUser } = useApp();
  const navigate = useNavigate();

  if (currentUser?.rol === 'viajante') return <Navigate to="/mis-remitos" replace />;

  const hoy = new Date().toISOString().split('T')[0];

  const pendientes = remitos.filter(r => r.estado === 'pendiente').length;
  const enCamino = remitos.filter(r => r.estado === 'en_camino').length;
  const entregadosHoy = remitos.filter(r => r.estado === 'entregado' && r.fechaEntrega === hoy).length;
  const conInconveniente = remitos.filter(r => r.estado === 'con_inconveniente').length;

  const totalHoy = remitos
    .filter(r => r.estado === 'entregado' && r.fechaEntrega === hoy)
    .reduce((sum, r) => sum + r.total, 0);

  const stockBajo = productos.filter(p => p.stockActual <= p.stockMinimo).length;
  const insumosBajos = insumos.filter(i => i.stockActual <= i.stockMinimo).length;

  const ultimosRemitos = [...remitos]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 5);

  const fmt = (n: number) => `$${n.toLocaleString('es-AR')}`;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}>
          Buen día, {currentUser?.nombre.split(' ')[0]} 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
          {new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Pendientes" value={pendientes} sub="por salir" color="var(--color-accent)" />
        <StatCard label="En camino" value={enCamino} sub="en tránsito" color="#1F6FAE" />
        <StatCard label="Entregados hoy" value={entregadosHoy} sub={fmt(totalHoy)} color="var(--color-primary)" />
        <StatCard label="Con inconveniente" value={conInconveniente} sub="requieren atención" color="#B5392A" />
      </div>

      {/* Alerts */}
      {(stockBajo > 0 || insumosBajos > 0 || conInconveniente > 0) && (
        <div className="mb-8 space-y-2">
          {conInconveniente > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm border"
              style={{ background: '#FEE2E2', borderColor: '#FCA5A5', color: '#991B1B' }}>
              <span>⚠️</span>
              <span><strong>{conInconveniente}</strong> remito{conInconveniente > 1 ? 's' : ''} con inconvenientes requieren atención.</span>
              <button onClick={() => navigate('/remitos?estado=con_inconveniente')}
                className="ml-auto text-xs underline font-medium">Ver</button>
            </div>
          )}
          {stockBajo > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm border"
              style={{ background: '#FEF3C7', borderColor: '#FCD34D', color: '#92400E' }}>
              <span>📦</span>
              <span><strong>{stockBajo}</strong> producto{stockBajo > 1 ? 's' : ''} con stock bajo.</span>
              <button onClick={() => navigate('/productos')}
                className="ml-auto text-xs underline font-medium">Ver</button>
            </div>
          )}
          {insumosBajos > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm border"
              style={{ background: '#FEF3C7', borderColor: '#FCD34D', color: '#92400E' }}>
              <span>🧴</span>
              <span><strong>{insumosBajos}</strong> insumo{insumosBajos > 1 ? 's' : ''} con stock bajo.</span>
              <button onClick={() => navigate('/inventario')}
                className="ml-auto text-xs underline font-medium">Ver</button>
            </div>
          )}
        </div>
      )}

      {/* Remitos recientes */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--color-foreground)' }}>Remitos recientes</h2>
          <button onClick={() => navigate('/remitos')}
            className="text-sm font-medium transition-colors hover:opacity-70"
            style={{ color: 'var(--color-primary)' }}>
            Ver todos →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--color-muted)' }}>
                {['Número', 'Cliente', 'Fecha', 'Viajante', 'Total', 'Estado'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--color-muted-foreground)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ultimosRemitos.map((r, i) => (
                <tr key={r.id}
                  onClick={() => navigate(`/remitos/${r.id}`)}
                  className="border-t cursor-pointer transition-colors hover:bg-[var(--color-muted)]"
                  style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3 font-mono text-xs font-medium" style={{ color: 'var(--color-primary)' }}>
                    {r.numero}
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-foreground)' }}>
                    {r.clienteNombre}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-muted-foreground)' }}>
                    {new Date(r.fecha + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-muted-foreground)' }}>
                    {r.viajanteNombre || <span className="italic opacity-50">Sin asignar</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-semibold" style={{ color: 'var(--color-foreground)' }}>
                    {fmt(r.total)}
                  </td>
                  <td className="px-4 py-3">
                    <EstadoBadge estado={r.estado as EstadoRemito} />
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
