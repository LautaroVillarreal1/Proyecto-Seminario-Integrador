import { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Producto } from '../types';

const CATEGORIAS = ['Yogures', 'Kéfir', 'Granolas'];

function StockIndicator({ actual, minimo }: { actual: number; minimo: number }) {
  const pct = Math.min(100, Math.round((actual / (minimo * 3)) * 100));
  const bajo = actual <= minimo;
  const color = bajo ? '#B5392A' : actual <= minimo * 1.5 ? '#C4761E' : 'var(--color-primary)';
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
  const { productos, setProductos } = useApp();
  const [search, setSearch] = useState('');
  const [catFiltro, setCatFiltro] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState<Partial<Producto>>({});

  const filtered = productos
    .filter(p => !catFiltro || p.categoria === catFiltro)
    .filter(p => !search || p.nombre.toLowerCase().includes(search.toLowerCase()));

  const startEdit = (p: Producto) => { setEditId(p.id); setForm(p); setShowNew(false); };
  const startNew = () => { setShowNew(true); setEditId(null); setForm({ activo: true, unidad: 'unidad' }); };
  const cancel = () => { setEditId(null); setShowNew(false); setForm({}); };

  const save = () => {
    if (!form.nombre?.trim() || !form.precioVenta || !form.categoria) return;
    if (showNew) {
      const nuevo: Producto = {
        id: `p${Date.now()}`,
        nombre: form.nombre!, descripcion: form.descripcion || '',
        categoria: form.categoria!, unidad: form.unidad || 'unidad',
        precioVenta: Number(form.precioVenta),
        stockActual: Number(form.stockActual || 0),
        stockMinimo: Number(form.stockMinimo || 10),
        activo: form.activo !== false,
      };
      setProductos([...productos, nuevo]);
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
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}>Productos</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>{filtered.length} productos</p>
        </div>
        <button onClick={startNew}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 flex items-center gap-2"
          style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
          + Nuevo producto
        </button>
      </div>

      {/* New/Edit form */}
      {(showNew || editId) && (
        <div className="mb-6 rounded-2xl border p-5" style={{ background: 'var(--color-card)', borderColor: 'var(--color-accent)' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-foreground)' }}>
            {showNew ? 'Nuevo producto' : 'Editar producto'}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { key: 'nombre', label: 'Nombre *', type: 'text' },
              { key: 'descripcion', label: 'Descripción', type: 'text' },
              { key: 'precioVenta', label: 'Precio venta *', type: 'number' },
              { key: 'stockActual', label: 'Stock actual', type: 'number' },
              { key: 'stockMinimo', label: 'Stock mínimo', type: 'number' },
              { key: 'unidad', label: 'Unidad', type: 'text' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>{f.label}</label>
                <input
                  type={f.type}
                  value={(form as any)[f.key] || ''}
                  onChange={e => setForm({ ...form, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                  style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Categoría *</label>
              <select
                value={form.categoria || ''}
                onChange={e => setForm({ ...form, categoria: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}>
                <option value="">Seleccionar</option>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
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

      {/* Filters */}
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

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--color-muted)' }}>
                {['Producto', 'Categoría', 'Precio', 'Stock', 'Unidad', 'Estado', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                    style={{ color: 'var(--color-muted-foreground)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
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
                  <td className="px-4 py-3">
                    <button onClick={() => startEdit(p)}
                      className="text-xs hover:opacity-70 transition-opacity"
                      style={{ color: 'var(--color-primary)' }}>Editar</button>
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
