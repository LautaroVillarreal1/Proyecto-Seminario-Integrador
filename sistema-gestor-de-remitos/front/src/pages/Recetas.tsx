import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Recetas() {
  const { recetas, productos, insumos } = useApp();
  const [selectedId, setSelectedId] = useState(recetas[0]?.id || '');
  const [calcQty, setCalcQty] = useState<Record<string, number>>({});

  const receta = recetas.find(r => r.id === selectedId);

  const calcularProduccion = (recetaId: string) => {
    const r = recetas.find(x => x.id === recetaId);
    if (!r) return 0;
    const limitantes = r.ingredientes.map(ing => {
      const insumo = insumos.find(i => i.id === ing.insumoId);
      if (!insumo) return 0;
      const lotes = Math.floor(insumo.stockActual / ing.cantidad);
      return lotes * r.rendimiento;
    });
    return limitantes.length > 0 ? Math.min(...limitantes) : 0;
  };

  const produccionPosible = receta ? calcularProduccion(receta.id) : 0;

  const calcularInsumosPara = (cantidad: number) => {
    if (!receta) return [];
    const lotes = cantidad / receta.rendimiento;
    return receta.ingredientes.map(ing => ({
      ...ing,
      cantidadNecesaria: ing.cantidad * lotes,
      insumo: insumos.find(i => i.id === ing.insumoId),
    }));
  };

  const cantidadTarget = calcQty[selectedId] || receta?.rendimiento || 0;
  const desglose = calcularInsumosPara(cantidadTarget);

  const formatMin = (min: number) => {
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}h${m > 0 ? ` ${m}min` : ''}`;
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}>
          Recetas
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
          Calculá cuánto podés producir según los insumos disponibles
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sidebar recetas */}
        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-3 px-1" style={{ color: 'var(--color-muted-foreground)' }}>
            Productos con receta
          </h2>
          {recetas.map(r => {
            const posible = calcularProduccion(r.id);
            const isSelected = r.id === selectedId;
            return (
              <button key={r.id} onClick={() => setSelectedId(r.id)}
                className="w-full text-left px-4 py-3.5 rounded-2xl border transition-all"
                style={{
                  background: isSelected ? 'var(--color-primary)' : 'var(--color-card)',
                  borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                  color: isSelected ? 'var(--color-primary-foreground)' : 'var(--color-foreground)',
                }}>
                <div className="font-medium text-sm">{r.productoNombre}</div>
                <div className="text-xs mt-1 flex items-center gap-2"
                  style={{ color: isSelected ? 'rgba(242,247,236,0.7)' : 'var(--color-muted-foreground)' }}>
                  <span>Rinde {r.rendimiento} {r.unidadRendimiento}</span>
                  <span>·</span>
                  <span style={{ color: posible === 0 ? '#F87171' : isSelected ? 'rgba(242,247,236,0.9)' : 'var(--color-primary)' }}>
                    {posible === 0 ? '⚠ Sin stock' : `≈ ${posible} posibles`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail */}
        {receta ? (
          <div className="lg:col-span-2 space-y-5">
            {/* Header */}
            <div className="rounded-2xl border p-5" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-xl font-bold" style={{ color: 'var(--color-foreground)', fontFamily: 'var(--font-display)' }}>
                    {receta.productoNombre}
                  </h2>
                  <div className="flex gap-4 mt-2 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                    <span>🕒 {formatMin(receta.tiempoPrepMin)}</span>
                    <span>📦 Rinde {receta.rendimiento} {receta.unidadRendimiento}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--color-muted-foreground)' }}>
                    Producción posible ahora
                  </div>
                  <div className="text-3xl font-bold" style={{
                    fontFamily: 'var(--font-display)',
                    color: produccionPosible === 0 ? '#B5392A' : 'var(--color-primary)'
                  }}>
                    {produccionPosible}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{receta.unidadRendimiento}</div>
                </div>
              </div>
              {receta.instrucciones && (
                <p className="mt-4 text-sm leading-relaxed p-3 rounded-xl"
                  style={{ background: 'var(--color-muted)', color: 'var(--color-foreground)' }}>
                  {receta.instrucciones}
                </p>
              )}
            </div>

            {/* Ingredientes */}
            <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
              <h3 className="text-xs font-semibold uppercase tracking-widest px-5 py-4 border-b"
                style={{ color: 'var(--color-muted-foreground)', borderColor: 'var(--color-border)' }}>
                Ingredientes por tanda ({receta.rendimiento} {receta.unidadRendimiento})
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--color-muted)' }}>
                    {['Insumo', 'Cantidad', 'Stock disponible', 'Estado'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {receta.ingredientes.map((ing, i) => {
                    const insumo = insumos.find(x => x.id === ing.insumoId);
                    const suficiente = insumo && insumo.stockActual >= ing.cantidad;
                    return (
                      <tr key={i} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                        <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-foreground)' }}>{ing.insumoNombre}</td>
                        <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                          {ing.cantidad} {ing.unidad}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                          {insumo ? `${insumo.stockActual} ${insumo.unidad}` : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${suficiente ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                            {suficiente ? '✓ OK' : '✕ Insuficiente'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Calculadora */}
            <div className="rounded-2xl border p-5" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
              <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--color-muted-foreground)' }}>
                Calculadora de producción
              </h3>
              <div className="flex items-center gap-3 mb-4">
                <label className="text-sm" style={{ color: 'var(--color-foreground)' }}>Quiero producir</label>
                <input
                  type="number"
                  min={receta.rendimiento}
                  step={receta.rendimiento}
                  value={cantidadTarget}
                  onChange={e => setCalcQty({ ...calcQty, [selectedId]: Number(e.target.value) })}
                  className="w-24 px-3 py-2 rounded-xl border text-sm font-mono text-center outline-none"
                  style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
                />
                <span className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>{receta.unidadRendimiento}</span>
              </div>
              <div className="space-y-1.5">
                {desglose.map((d, i) => {
                  const suficiente = d.insumo && d.insumo.stockActual >= d.cantidadNecesaria;
                  const faltante = d.insumo ? Math.max(0, d.cantidadNecesaria - d.insumo.stockActual) : 0;
                  return (
                    <div key={i} className="flex items-center justify-between text-sm px-3 py-2 rounded-xl"
                      style={{ background: suficiente ? 'var(--color-muted)' : '#FFF5F5' }}>
                      <span style={{ color: 'var(--color-foreground)' }}>{d.insumoNombre}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                          necesito {d.cantidadNecesaria.toFixed(1)} {d.unidad}
                        </span>
                        {!suficiente && faltante > 0 && (
                          <span className="text-xs font-semibold" style={{ color: '#B5392A' }}>
                            faltan {faltante.toFixed(1)}
                          </span>
                        )}
                        {suficiente && <span className="text-xs" style={{ color: 'var(--color-primary)' }}>✓</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 flex items-center justify-center rounded-2xl border" style={{ borderColor: 'var(--color-border)', minHeight: 200 }}>
            <p className="text-sm italic" style={{ color: 'var(--color-muted-foreground)' }}>Seleccioná una receta</p>
          </div>
        )}
      </div>
    </div>
  );
}
