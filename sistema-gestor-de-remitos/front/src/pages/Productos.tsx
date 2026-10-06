import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Producto, Receta } from '../types';

const CATEGORIAS = ['Yogures', 'Kéfir', 'Granolas'];
type ProductoForm = Omit<Partial<Producto>, 'precioVenta' | 'stockActual' | 'stockMinimo'> & {
  precioVenta?: number | string;
  stockActual?: number | string;
  stockMinimo?: number | string;
  recetaRendimiento?: number;
  recetaUnidadRendimiento?: string;
  recetaTiempoPrepMin?: number;
  recetaInstrucciones?: string;
};
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
  const { productos, recetas, setProductos, setRecetas, openProductDetails, notifyError } = useApp();
  const [search, setSearch] = useState('');
  const [catFiltro, setCatFiltro] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [createRecipe, setCreateRecipe] = useState(false);
  const [form, setForm] = useState<ProductoForm>({ activo: true, unidad: 'Unidad', codigo: '', codigoBarras: '' });

  const filtered = productos
    .filter(p => !catFiltro || p.categoria === catFiltro)
    .filter(p => !search || p.nombre.toLowerCase().includes(search.toLowerCase()) || p.codigo.toLowerCase().includes(search.toLowerCase()));

  const unitLabel = useMemo(() => {
    const value = (form.unidad ?? 'Unidad').toLowerCase();
    return UNIDADES.find(u => u.value.toLowerCase() === value || u.label.toLowerCase() === value || u.abreviatura.toLowerCase() === value)?.label ?? value;
  }, [form.unidad]);

  const startNew = () => { setShowNew(true); setEditId(null); setCreateRecipe(false); setForm({ activo: true, unidad: 'Unidad', codigo: '', codigoBarras: '', precioVenta: 0, stockActual: 0, stockMinimo: 0, recetaRendimiento: 1, recetaUnidadRendimiento: 'unidad', recetaTiempoPrepMin: 15, recetaInstrucciones: '' }); };
  const cancel = () => { setEditId(null); setShowNew(false); setCreateRecipe(false); setForm({ activo: true, unidad: 'Unidad', codigo: '', codigoBarras: '' }); };

  const save = async () => {
    const nombre = form.nombre?.trim() ?? '';
    const codigo = form.codigo?.trim() ?? '';
    const stockActual = Number(form.stockActual ?? 0);
    const stockMinimo = Number(form.stockMinimo ?? 0);

    const missing = [!codigo && 'Código', !nombre && 'Nombre', !form.categoria && 'Categoría'].filter(Boolean);
    if (missing.length) { notifyError(`Completá los datos obligatorios: ${missing.join(', ')}.`); return; }
    if (form.precioVenta === undefined || form.precioVenta === null || form.precioVenta === '') { notifyError('El precio de venta es obligatorio.'); return; }
    const precio = Number(form.precioVenta);
    if (!Number.isFinite(precio)) { notifyError('Ingresá un precio de venta válido.'); return; }
    if (precio < 0) { notifyError('El precio de venta no puede ser negativo.'); return; }
    if (!Number.isFinite(stockActual) || !Number.isFinite(stockMinimo) || stockActual < 0 || stockMinimo < 0) { notifyError('Ingresá valores de stock válidos y no negativos.'); return; }

    if (showNew) {
      const nuevo: Producto = {
        id: `p${Date.now()}`,
        codigo,
        codigoBarras: form.codigoBarras?.trim() || undefined,
        nombre,
        descripcion: form.descripcion || '',
        categoria: form.categoria!,
        unidad: form.unidad || 'Unidad',
        precioVenta: precio,
        stockActual,
        stockMinimo,
        activo: form.activo !== false,
      };
      const savedProduct = await setProductos([...productos, nuevo]);
      if (!savedProduct) return;

      if (createRecipe) {
        const nuevaReceta: Receta = {
          id: `r${Date.now()}`,
          productoId: savedProduct.id,
          productoNombre: nuevo.nombre,
          rendimiento: Number(form.recetaRendimiento || 1),
          unidadRendimiento: form.recetaUnidadRendimiento || 'unidad',
          tiempoPrepMin: Number(form.recetaTiempoPrepMin || 0),
          instrucciones: form.recetaInstrucciones || '',
          ingredientes: [],
        };
        if (!await setRecetas([...recetas, nuevaReceta])) return;
      }
    } else if (editId) {
      if (!await setProductos(productos.map(p => p.id === editId ? { ...p, ...form, codigo: codigo || p.codigo, nombre, descripcion: form.descripcion || '', categoria: form.categoria || p.categoria, unidad: form.unidad || p.unidad, precioVenta: precio, stockActual, stockMinimo, activo: form.activo !== false } as Producto : p))) return;
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
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Código *</label>
              <input value={form.codigo || ''} onChange={e => setForm({ ...form, codigo: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Código de barras</label>
              <input value={form.codigoBarras || ''} onChange={e => setForm({ ...form, codigoBarras: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }} />
            </div>
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
              <input type="text" inputMode="decimal" value={form.precioVenta ?? ''} onChange={e => { const value = e.target.value.replace(',', '.'); if (/^\d*\.?\d*$/.test(value)) setForm({ ...form, precioVenta: value === '' ? undefined : value }); }}
                onKeyDown={e => { if (['-', '+', 'e', 'E'].includes(e.key)) e.preventDefault(); }}
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
              <input type="text" inputMode="decimal" value={form.stockActual ?? ''} onChange={e => { const value = e.target.value.replace(',', '.'); if (/^\d*\.?\d*$/.test(value)) setForm({ ...form, stockActual: value === '' ? undefined : value }); }}
                onKeyDown={e => { if (['-', '+', 'e', 'E'].includes(e.key)) e.preventDefault(); }}
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Stock mínimo</label>
              <input type="text" inputMode="decimal" value={form.stockMinimo ?? ''} onChange={e => { const value = e.target.value.replace(',', '.'); if (/^\d*\.?\d*$/.test(value)) setForm({ ...form, stockMinimo: value === '' ? undefined : value }); }}
                onKeyDown={e => { if (['-', '+', 'e', 'E'].includes(e.key)) e.preventDefault(); }}
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
                  <input type="number" min={1} value={form.recetaRendimiento ?? ''} onChange={e => setForm({ ...form, recetaRendimiento: e.target.value === '' ? undefined : Number(e.target.value) })}
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
                  <input type="number" min={0} value={form.recetaTiempoPrepMin ?? ''} onChange={e => setForm({ ...form, recetaTiempoPrepMin: e.target.value === '' ? undefined : Number(e.target.value) })}
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
                {['Código', 'Producto', 'Categoría', 'Precio', 'Stock', 'Unidad', 'Estado'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                    style={{ color: 'var(--color-muted-foreground)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-t cursor-pointer transition-colors hover:opacity-90" style={{ borderColor: 'var(--color-border)' }} onClick={() => openProductDetails(p.id)}>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--color-foreground)' }}>{p.codigo}</td>
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
