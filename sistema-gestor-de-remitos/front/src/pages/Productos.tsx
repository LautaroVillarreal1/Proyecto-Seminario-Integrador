import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Producto, Receta } from '../types';

const CATEGORIAS = ['Yogures', 'Kéfir', 'Granolas'];
const UNIDADES = [
  { value: 'Litro', label: 'Litro', abreviatura: 'L' },
  { value: 'Mililitro', label: 'Mililitro', abreviatura: 'ml' },
  { value: 'Kilogramo', label: 'Kilogramo', abreviatura: 'kg' },
  { value: 'Gramo', label: 'Gramo', abreviatura: 'g' },
  { value: 'Unidad', label: 'Unidad', abreviatura: 'u' },
  { value: 'Docena', label: 'Docena', abreviatura: 'dz' },
  { value: 'Pallet', label: 'Pallet', abreviatura: 'pallet' },
];

function StockIndicator({ actual, minimo }: { actual: number; minimo: number }) {
  const pct = Math.min(100, Math.round((actual / (minimo * 3)) * 100));
  const bajo = actual <= minimo;
  const color = bajo ? '#E53935' : actual <= minimo * 1.5 ? '#D9A441' : 'var(--color-primary)';
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className="font-mono text-xs font-semibold" style={{ color }}>{actual}</span>
        <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>/ mín {minimo}</span>
      </div>
      <div className="h-1.5 rounded-full w-20 overflow-hidden" style={{ background: 'var(--color-muted)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function Productos() {
  const { productos, recetas, setProductos, setRecetas } = useApp();
  const [search, setSearch] = useState('');
  const [catFiltro, setCatFiltro] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [createRecipe, setCreateRecipe] = useState(false);
  const [form, setForm] = useState<Partial<Producto & { recetaRendimiento: number; recetaUnidadRendimiento: string; recetaTiempoPrepMin: number; recetaInstrucciones: string }>>({ activo: true, unidad: 'Unidad' });

  const filtered = productos
    .filter(p => !catFiltro || p.categoria === catFiltro)
    .filter(p => !search || p.nombre.toLowerCase().includes(search.toLowerCase()));

  const selectedProduct = productos.find(p => p.id === selectedProductId) ?? null;
  const selectedRecipe = recetas.find(r => r.productoId === selectedProduct?.id);

  const unitLabel = useMemo(() => {
    const value = (form.unidad ?? 'Unidad').toLowerCase();
    return UNIDADES.find(u => u.value.toLowerCase() === value || u.label.toLowerCase() === value || u.abreviatura.toLowerCase() === value)?.label ?? value;
  }, [form.unidad]);

  const startDetail = (p: Producto) => { setSelectedProductId(p.id); setEditId(null); setShowNew(false); };
  const startNew = () => { setShowNew(true); setEditId(null); setSelectedProductId(null); setCreateRecipe(false); setForm({ activo: true, unidad: 'Unidad', recetaRendimiento: 1, recetaUnidadRendimiento: 'unidad', recetaTiempoPrepMin: 15, recetaInstrucciones: '' }); };
  const cancel = () => { setEditId(null); setShowNew(false); setSelectedProductId(null); setCreateRecipe(false); setForm({ activo: true, unidad: 'Unidad' }); };

  const save = () => {
    if (!form.nombre?.trim() || !form.precioVenta || !form.categoria) return;
    if (showNew) {
      const nuevo: Producto = {
        id: `p${Date.now()}`,
        nombre: form.nombre!, descripcion: form.descripcion || '',
        categoria: form.categoria!, unidad: form.unidad || 'Unidad',
        precioVenta: Number(form.precioVenta),
        stockActual: Number(form.stockActual || 0),
        stockMinimo: Number(form.stockMinimo || 10),
        activo: form.activo !== false,
      };
      setProductos([...productos, nuevo]);

      if (createRecipe) {
        const nuevaReceta: Receta = {
          id: `r${Date.now()}`,
          productoId: nuevo.id,
          productoNombre: nuevo.nombre,
          rendimiento: Number(form.recetaRendimiento || 1),
          unidadRendimiento: form.recetaUnidadRendimiento || 'unidad',
          tiempoPrepMin: Number(form.recetaTiempoPrepMin || 0),
          instrucciones: form.recetaInstrucciones || '',
          ingredientes: [],
        };
        setRecetas([...recetas, nuevaReceta]);
      }
    } else if (editId) {
      setProductos(productos.map(p => p.id === editId ? { ...p, ...form } as Producto : p));
    }
    cancel();
  };

  const fmt = (n: number) => `$${n.toLocaleString('es-AR')}`;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "'Baloo 2', 'Inter', sans-serif", color: 'var(--color-foreground)' }}>Productos</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>{filtered.length} productos</p>
        </div>
        <button onClick={startNew}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 flex items-center gap-2"
          style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
          + Nuevo producto
        </button>
      </div>

      {(showNew || editId) && (
        <div className="mb-6 rounded-2xl border p-5" style={{ background: 'var(--color-card)', borderColor: 'var(--color-accent)' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-foreground)' }}>
            {showNew ? 'Nuevo producto' : 'Editar producto'}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Nombre *</label>
              <input value={form.nombre || ''} onChange={e => setForm({ ...form, nombre: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Descripción</label>
              <input value={form.descripcion || ''} onChange={e => setForm({ ...form, descripcion: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Precio venta *</label>
              <input type="number" min={0} value={form.precioVenta || ''} onChange={e => setForm({ ...form, precioVenta: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Categoría *</label>
              <select value={form.categoria || ''} onChange={e => setForm({ ...form, categoria: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}>
                <option value="">Seleccionar</option>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Stock actual</label>
              <input type="number" min={0} value={form.stockActual || 0} onChange={e => setForm({ ...form, stockActual: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Stock mínimo</label>
              <input type="number" min={0} value={form.stockMinimo || 0} onChange={e => setForm({ ...form, stockMinimo: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Unidad</label>
              <select value={form.unidad || 'Unidad'} onChange={e => setForm({ ...form, unidad: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}>
                {UNIDADES.map(u => <option key={u.value} value={u.value}>{u.label} ({u.abreviatura})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Estado</label>
              <select value={form.activo === false ? 'Inactivo' : 'Activo'} onChange={e => setForm({ ...form, activo: e.target.value === 'Activo' })}
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}>
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          <div className="mt-4 border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={createRecipe} onChange={e => setCreateRecipe(e.target.checked)} id="crearReceta" />
              <label htmlFor="crearReceta" className="text-sm" style={{ color: 'var(--color-foreground)' }}>Crear también una receta</label>
            </div>
            {createRecipe && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Rendimiento</label>
                  <input type="number" min={1} value={form.recetaRendimiento ?? 1} onChange={e => setForm({ ...form, recetaRendimiento: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                    style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Unidad de rendimiento</label>
                  <input value={form.recetaUnidadRendimiento || 'unidad'} onChange={e => setForm({ ...form, recetaUnidadRendimiento: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                    style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Tiempo prep. (min)</label>
                  <input type="number" min={0} value={form.recetaTiempoPrepMin ?? 15} onChange={e => setForm({ ...form, recetaTiempoPrepMin: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                    style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Instrucciones</label>
                  <input value={form.recetaInstrucciones || ''} onChange={e => setForm({ ...form, recetaInstrucciones: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                    style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }} />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <button onClick={save}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
              Guardar
            </button>
            <button onClick={cancel}
              className="px-4 py-2 rounded-xl text-sm border transition-colors hover:opacity-70"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {selectedProduct && (
        <section className="mb-6 rounded-2xl border p-5" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-foreground)', fontFamily: "'Baloo 2', 'Inter', sans-serif" }}>{selectedProduct.nombre}</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>{selectedProduct.descripcion || 'Sin descripción'}</p>
            </div>
            <button onClick={() => setSelectedProductId(null)} className="px-3 py-2 rounded-xl border text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}>Cerrar</button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            <div className="rounded-xl p-3" style={{ background: 'var(--color-muted)' }}><span className="text-xs uppercase" style={{ color: 'var(--color-muted-foreground)' }}>Categoría</span><div className="font-semibold mt-1">{selectedProduct.categoria}</div></div>
            <div className="rounded-xl p-3" style={{ background: 'var(--color-muted)' }}><span className="text-xs uppercase" style={{ color: 'var(--color-muted-foreground)' }}>Precio</span><div className="font-semibold mt-1">{fmt(selectedProduct.precioVenta)}</div></div>
            <div className="rounded-xl p-3" style={{ background: 'var(--color-muted)' }}><span className="text-xs uppercase" style={{ color: 'var(--color-muted-foreground)' }}>Unidad</span><div className="font-semibold mt-1">{selectedProduct.unidad}</div></div>
            <div className="rounded-xl p-3" style={{ background: 'var(--color-muted)' }}><span className="text-xs uppercase" style={{ color: 'var(--color-muted-foreground)' }}>Estado</span><div className="font-semibold mt-1">{selectedProduct.activo ? 'Activo' : 'Inactivo'}</div></div>
          </div>
          {selectedRecipe ? (
            <div className="mt-4 rounded-xl border p-4" style={{ borderColor: 'var(--color-border)' }}>
              <div className="font-semibold" style={{ color: 'var(--color-foreground)' }}>Receta</div>
              <div className="text-sm mt-2" style={{ color: 'var(--color-muted-foreground)' }}>{selectedRecipe.rendimiento} {selectedRecipe.unidadRendimiento} · {selectedRecipe.tiempoPrepMin} min</div>
              <div className="text-sm mt-2" style={{ color: 'var(--color-foreground)' }}>{selectedRecipe.instrucciones || 'Sin instrucciones'}</div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', color: '#E53935' }}>Sin receta definida para este producto. Definila en Recetas.</div>
          )}
        </section>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input type="text" placeholder="Buscar…" value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 px-3 py-2.5 rounded-xl border text-sm outline-none"
          style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }} />
        <div className="flex gap-2">
          {['', ...CATEGORIAS].map(c => (
            <button key={c} onClick={() => setCatFiltro(c)}
              className="px-3 py-2 rounded-xl text-xs font-medium border transition-colors"
              style={{
                background: catFiltro === c ? 'var(--color-primary)' : 'var(--color-card)',
                color: catFiltro === c ? 'var(--color-primary-foreground)' : 'var(--color-foreground)',
                borderColor: catFiltro === c ? 'var(--color-primary)' : 'var(--color-border)',
              }}>
              {c || 'Todos'}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--color-muted)' }}>
                {['Producto', 'Categoría', 'Precio', 'Stock', 'Unidad', 'Estado'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                    style={{ color: 'var(--color-muted-foreground)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-t cursor-pointer transition-colors hover:opacity-90" style={{ borderColor: 'var(--color-border)' }} onClick={() => startDetail(p)}>
                  <td className="px-4 py-3">
                    <div className="font-medium" style={{ color: 'var(--color-foreground)' }}>{p.nombre}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>{p.descripcion}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{ background: 'var(--color-secondary)', color: 'var(--color-secondary-foreground)' }}>
                      {p.categoria}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-semibold" style={{ color: 'var(--color-foreground)' }}>
                    {fmt(p.precioVenta)}
                  </td>
                  <td className="px-4 py-3">
                    <StockIndicator actual={p.stockActual} minimo={p.stockMinimo} />
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{p.unidad}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${p.activo ? 'text-green-700 bg-green-50' : 'text-gray-500 bg-gray-100'}`}>
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
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
