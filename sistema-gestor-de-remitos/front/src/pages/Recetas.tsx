import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { Receta } from '../types';

type RecipeDraft = {
  productoId: string;
  productoNombre: string;
  rendimiento: number;
  unidadRendimiento: string;
  tiempoPrepMin: number;
  instrucciones: string;
  ingredientes: Array<{ insumoId: string; insumoNombre: string; cantidad: number; unidad: string }>;
};

export default function Recetas() {
  const { recetas, productos, insumos, setRecetas, notifyError } = useApp();
  const [searchParams] = useSearchParams();
  const requestedRecipeId = searchParams.get('recetaId');
  const requestedProductId = searchParams.get('productoId');
  const [selectedId, setSelectedId] = useState(() => {
    const requestedRecipe = recetas.find(r => r.id === requestedRecipeId || r.productoId === requestedProductId);
    return requestedRecipe?.id ?? (requestedProductId ? '' : recetas[0]?.id ?? '');
  });
  const [calcQty, setCalcQty] = useState<Record<string, number>>({});
  const [draft, setDraft] = useState<RecipeDraft | null>(null);

  const receta = recetas.find(r => r.id === selectedId) ?? null;

  const productoSeleccionado = productos.find(p => p.id === draft?.productoId) ?? productos.find(p => p.id === receta?.productoId) ?? null;

  useEffect(() => {
    if (draft) return;
    if (receta) {
      setDraft(toDraft(receta));
      return;
    }
    const product = productos.find(item => item.id === requestedProductId);
    if (!product) return;
    setDraft({
      productoId: product.id,
      productoNombre: product.nombre,
      rendimiento: 1,
      unidadRendimiento: 'unidad',
      tiempoPrepMin: 0,
      instrucciones: '',
      ingredientes: [],
    });
  }, [draft, receta, productos, requestedProductId]);

  const toDraft = (value: Receta | null): RecipeDraft | null => {
    if (!value) return null;
    return {
      productoId: value.productoId,
      productoNombre: value.productoNombre,
      rendimiento: value.rendimiento,
      unidadRendimiento: value.unidadRendimiento,
      tiempoPrepMin: value.tiempoPrepMin,
      instrucciones: value.instrucciones ?? '',
      ingredientes: value.ingredientes.map(ing => ({ insumoId: ing.insumoId, insumoNombre: ing.insumoNombre, cantidad: ing.cantidad, unidad: ing.unidad })),
    };
  };

  const calcularProduccion = (recetaId: string) => {
    const r = recetas.find(x => x.id === recetaId);
    if (!r) return 0;
    const limitantes = r.ingredientes.map(ing => {
      const insumo = insumos.find(i => i.id === ing.insumoId);
      if (!insumo) return 0;
      const lotes = Math.floor(insumo.stockActual / Math.max(ing.cantidad, 1));
      return lotes * r.rendimiento;
    });
    return limitantes.length > 0 ? Math.min(...limitantes) : 0;
  };

  const produccionPosible = receta ? calcularProduccion(receta.id) : 0;

  const calcularInsumosPara = (cantidad: number) => {
    if (!receta) return [];
    const lotes = cantidad / Math.max(receta.rendimiento, 1);
    return receta.ingredientes.map(ing => ({
      ...ing,
      cantidadNecesaria: ing.cantidad * lotes,
      insumo: insumos.find(i => i.id === ing.insumoId),
    }));
  };

  const cantidadTarget = calcQty[selectedId] ?? receta?.rendimiento ?? 0;
  const desglose = calcularInsumosPara(cantidadTarget);

  const formatMin = (min: number) => {
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}h${m > 0 ? ` ${m}min` : ''}`;
  };

  const productosConReceta = useMemo(() => new Set(recetas.map(r => r.productoId)), [recetas]);
  const productosSinReceta = productos.filter(p => !productosConReceta.has(p.id));

  const handleSelectRecipe = (id: string) => {
    setSelectedId(id);
    const next = recetas.find(r => r.id === id) ?? null;
    setDraft(toDraft(next));
  };

  const handleCreateOrUpdate = async () => {
    if (!draft || !draft.productoId) { notifyError('Seleccioná un producto para la receta.'); return; }
    if (!draft.unidadRendimiento.trim() || draft.rendimiento < 1) { notifyError('Completá la unidad y un rendimiento mayor que cero.'); return; }
    if (draft.ingredientes.length === 0 || draft.ingredientes.some(ingredient => !ingredient.insumoId || ingredient.cantidad <= 0)) {
      notifyError('Agregá al menos un insumo con una cantidad mayor que cero.');
      return;
    }
    const nextRecipe: Receta = {
      id: receta?.id ?? `r${Date.now()}`,
      productoId: draft.productoId,
      productoNombre: productos.find(p => p.id === draft.productoId)?.nombre ?? draft.productoNombre,
      rendimiento: Math.max(1, Number(draft.rendimiento || 1)),
      unidadRendimiento: draft.unidadRendimiento || 'unidad',
      tiempoPrepMin: Math.max(0, Number(draft.tiempoPrepMin || 0)),
      instrucciones: draft.instrucciones,
      ingredientes: draft.ingredientes.map(ing => ({
        insumoId: ing.insumoId,
        insumoNombre: insumos.find(i => i.id === ing.insumoId)?.nombre ?? ing.insumoNombre,
        cantidad: Math.max(0, Number(ing.cantidad || 0)),
        unidad: ing.unidad,
      })),
    };

    if (receta) {
      if (!await setRecetas(recetas.map(r => r.id === receta.id ? nextRecipe : r))) return;
    } else {
      const savedRecipe = await setRecetas([...recetas, nextRecipe]);
      if (!savedRecipe) return;
      setSelectedId(savedRecipe.id);
    }
  };

  const addIngredient = () => {
    const base = draft ?? {
      productoId: productos[0]?.id ?? '',
      productoNombre: productos[0]?.nombre ?? '',
      rendimiento: 1,
      unidadRendimiento: 'unidad',
      tiempoPrepMin: 0,
      instrucciones: '',
      ingredientes: [],
    };
    setDraft({
      ...base,
      ingredientes: [...base.ingredientes, { insumoId: insumos[0]?.id ?? '', insumoNombre: insumos[0]?.nombre ?? 'Insumo', cantidad: 1, unidad: insumos[0]?.unidad ?? 'unidad' }],
    });
  };

  const updateIngredient = (index: number, field: keyof RecipeDraft['ingredientes'][number], value: string | number) => {
    if (!draft) return;
    const next = [...draft.ingredientes];
    const item = { ...next[index] };
    if (field === 'insumoId') {
      const insumo = insumos.find(i => i.id === value);
      item.insumoId = String(value);
      item.insumoNombre = insumo?.nombre ?? item.insumoNombre;
      item.unidad = insumo?.unidad ?? item.unidad;
    } else if (field === 'cantidad') {
      item.cantidad = Math.max(0, Number(value || 0));
    } else if (field === 'insumoNombre') {
      item.insumoNombre = String(value);
    } else if (field === 'unidad') {
      item.unidad = String(value);
    }
    next[index] = item;
    setDraft({ ...draft, ingredientes: next });
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ fontFamily: "'Baloo 2', 'Inter', sans-serif", color: 'var(--color-foreground)' }}>
          Recetas
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
          Calculá cuánto podés producir según los insumos disponibles
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-3 px-1" style={{ color: 'var(--color-muted-foreground)' }}>
            Productos con receta
          </h2>
          {recetas.length === 0 && (
            <div className="rounded-2xl border p-4" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)', color: 'var(--color-muted-foreground)' }}>
              No hay recetas cargadas.
            </div>
          )}
          {recetas.map(r => {
            const posible = calcularProduccion(r.id);
            const isSelected = r.id === selectedId;
            return (
              <button key={r.id} onClick={() => handleSelectRecipe(r.id)}
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
                    {posible === 0 ? 'Sin stock' : `${posible} posibles`}
                  </span>
                </div>
              </button>
            );
          })}
          {productosSinReceta.length > 0 && (
            <div className="rounded-2xl border p-4 mt-4" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
              <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-muted-foreground)' }}>Sin receta</div>
              <div className="text-sm mt-2" style={{ color: 'var(--color-foreground)' }}>
                {productosSinReceta.map(p => p.nombre).join(', ')}
              </div>
              <div className="text-xs mt-2" style={{ color: '#E53935' }}>Definí una receta para estos productos.</div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-2xl border p-5" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
              <div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--color-foreground)', fontFamily: "'Baloo 2', 'Inter', sans-serif" }}>
                  {productoSeleccionado?.nombre ?? 'Nueva receta'}
                </h2>
                <div className="flex gap-4 mt-2 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                  <span>{formatMin(draft?.tiempoPrepMin ?? receta?.tiempoPrepMin ?? 0)}</span>
                  <span>Rinde {draft?.rendimiento ?? receta?.rendimiento ?? 0} {draft?.unidadRendimiento ?? receta?.unidadRendimiento ?? 'unidad'}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--color-muted-foreground)' }}>
                  Producción posible ahora
                </div>
                <div className="text-3xl font-bold" style={{
                  fontFamily: "'Baloo 2', 'Inter', sans-serif",
                  color: produccionPosible === 0 ? '#E53935' : 'var(--color-primary)'
                }}>
                  {produccionPosible}
                </div>
                <div className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{draft?.unidadRendimiento ?? receta?.unidadRendimiento ?? 'unidad'}</div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Producto</label>
                <select
                  value={draft?.productoId ?? receta?.productoId ?? productos[0]?.id ?? ''}
                  onChange={e => {
                    const product = productos.find(p => p.id === e.target.value);
                    setDraft(draft ? { ...draft, productoId: e.target.value, productoNombre: product?.nombre ?? draft.productoNombre } : {
                      productoId: e.target.value,
                      productoNombre: product?.nombre ?? '',
                      rendimiento: 1,
                      unidadRendimiento: 'unidad',
                      tiempoPrepMin: 0,
                      instrucciones: '',
                      ingredientes: [],
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                  style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
                >
                  {productos.map(product => <option key={product.id} value={product.id}>{product.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Rendimiento</label>
                <input type="number" min={1} value={draft?.rendimiento ?? receta?.rendimiento ?? 1} onChange={e => setDraft(draft ? { ...draft, rendimiento: Number(e.target.value) } : null)}
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                  style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Unidad</label>
                <input value={draft?.unidadRendimiento ?? receta?.unidadRendimiento ?? 'unidad'} onChange={e => setDraft(draft ? { ...draft, unidadRendimiento: e.target.value } : null)}
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                  style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Tiempo prep. (min)</label>
                <input type="number" min={0} value={draft?.tiempoPrepMin ?? receta?.tiempoPrepMin ?? 0} onChange={e => setDraft(draft ? { ...draft, tiempoPrepMin: Number(e.target.value) } : null)}
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                  style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }} />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Instrucciones</label>
                <textarea value={draft?.instrucciones ?? receta?.instrucciones ?? ''} onChange={e => setDraft(draft ? { ...draft, instrucciones: e.target.value } : null)} rows={3}
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                  style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }} />
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button onClick={handleCreateOrUpdate}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
                {receta ? 'Guardar cambios' : 'Crear receta'}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border p-5" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-muted-foreground)' }}>
                Ingredientes
              </h3>
              <button onClick={addIngredient} className="px-3 py-2 rounded-xl border text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}>
                + Agregar insumo
              </button>
            </div>
            <div className="space-y-3">
              {(draft?.ingredientes ?? receta?.ingredientes ?? []).map((ing, index) => (
                <div key={`${ing.insumoId}-${index}`} className="grid gap-2 sm:grid-cols-3">
                  <select value={ing.insumoId} onChange={e => updateIngredient(index, 'insumoId', e.target.value)}
                    className="px-3 py-2 rounded-xl border text-sm outline-none"
                    style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}>
                    {insumos.map(item => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                  </select>
                  <input type="number" min={0} value={ing.cantidad} onChange={e => updateIngredient(index, 'cantidad', Number(e.target.value))}
                    className="px-3 py-2 rounded-xl border text-sm outline-none"
                    style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }} />
                  <input value={ing.unidad} onChange={e => updateIngredient(index, 'unidad', e.target.value)}
                    className="px-3 py-2 rounded-xl border text-sm outline-none"
                    style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
