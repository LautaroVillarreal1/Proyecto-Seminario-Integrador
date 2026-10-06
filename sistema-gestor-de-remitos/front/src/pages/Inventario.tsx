import { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Insumo } from '../types';

function StockBar({ actual, minimo }: { actual: number; minimo: number }) {
  const pct = Math.min(100, Math.round((actual / (minimo * 4)) * 100));
  const bajo = actual <= minimo;
  const color = bajo ? '#E53935' : actual <= minimo * 1.5 ? '#D9A441' : 'var(--color-primary)';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-muted)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="font-mono text-xs w-14 text-right font-semibold" style={{ color }}>
        {actual}
      </span>
    </div>
  );
}

export default function Inventario() {
  const { insumos, setInsumos, notifyError } = useApp();
  const [editId, setEditId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState<Partial<Insumo>>({});
  const [search, setSearch] = useState('');
  const [solobajos, setSoloBajos] = useState(false);

  let filtered = insumos;
  if (search) filtered = filtered.filter(i => i.nombre.toLowerCase().includes(search.toLowerCase()));
  if (solobajos) filtered = filtered.filter(i => i.stockActual <= i.stockMinimo);

  const bajos = insumos.filter(i => i.stockActual <= i.stockMinimo).length;

  const startEdit = (i: Insumo) => { setEditId(i.id); setForm(i); setShowNew(false); };
  const startNew = () => { setShowNew(true); setEditId(null); setForm({}); };
  const cancel = () => { setEditId(null); setShowNew(false); setForm({}); };

  const save = async () => {
    if (!form.nombre?.trim()) { notifyError('Completá el dato obligatorio: Nombre del insumo.'); return; }
    if (form.costoUnitario === undefined || form.costoUnitario === null || form.costoUnitario === '') { notifyError('El costo unitario es obligatorio.'); return; }
    const costoUnitario = Number(form.costoUnitario);
    if (!Number.isFinite(costoUnitario)) { notifyError('Ingresá un costo unitario válido.'); return; }
    if (costoUnitario < 0) { notifyError('El costo unitario no puede ser negativo.'); return; }
    if (costoUnitario === 0) { notifyError('El costo unitario debe ser mayor que $0.'); return; }
    if (showNew) {
      const nuevo: Insumo = {
        id: `i${Date.now()}`,
        nombre: form.nombre!, unidad: form.unidad || 'unidades',
        stockActual: Number(form.stockActual || 0),
        stockMinimo: Number(form.stockMinimo || 0),
        proveedor: form.proveedor,
        costoUnitario,
      };
      if (!await setInsumos([...insumos, nuevo])) return;
    } else if (editId) {
      if (!await setInsumos(insumos.map(i => i.id === editId ? { ...i, ...form } as Insumo : i))) return;
    }
    cancel();
  };

  const ajustarStock = (id: string, delta: number) => {
    setInsumos(insumos.map(i => i.id === id ? { ...i, stockActual: Math.max(0, i.stockActual + delta) } : i));
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "'Baloo 2', 'Inter', sans-serif", color: 'var(--color-foreground)' }}>
            Inventario de insumos
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
            {insumos.length} insumos · {bajos > 0 && <span style={{ color: '#E53935' }}>{bajos} con stock bajo</span>}
          </p>
        </div>
        <button onClick={startNew}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 flex items-center gap-2"
          style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
          + Nuevo insumo
        </button>
      </div>

      {/* Form */}
      {(showNew || editId) && (
        <div className="mb-6 rounded-2xl border p-5" style={{ background: 'var(--color-card)', borderColor: 'var(--color-accent)' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-foreground)' }}>
            {showNew ? 'Nuevo insumo' : 'Editar insumo'}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { key: 'nombre', label: 'Nombre *', type: 'text' },
              { key: 'unidad', label: 'Unidad', type: 'text' },
              { key: 'stockActual', label: 'Stock actual', type: 'number' },
              { key: 'stockMinimo', label: 'Stock mínimo', type: 'number' },
              { key: 'costoUnitario', label: 'Costo unitario ($)', type: 'number' },
              { key: 'proveedor', label: 'Proveedor', type: 'text' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>{f.label}</label>
                <input type={f.type}
                  min={f.key === 'costoUnitario' ? 0.01 : undefined}
                  step={f.key === 'costoUnitario' ? '0.01' : undefined}
                  value={(form as any)[f.key] ?? ''}
                  onChange={e => setForm({ ...form, [f.key]: f.type === 'number' ? e.target.value === '' ? undefined : Number(e.target.value) : e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                  style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={save}
              className="px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90"
              style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>Guardar</button>
            <button onClick={cancel}
              className="px-4 py-2 rounded-xl text-sm border hover:opacity-70"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input type="text" placeholder="Buscar insumo…" value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 px-3 py-2.5 rounded-xl border text-sm outline-none"
          style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }} />
        <button onClick={() => setSoloBajos(!solobajos)}
          className="px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors"
          style={{
            background: solobajos ? '#FEE2E2' : 'var(--color-card)',
            borderColor: solobajos ? '#FCA5A5' : 'var(--color-border)',
            color: solobajos ? '#991B1B' : 'var(--color-foreground)',
          }}>
          {solobajos ? 'Quitar filtro: ' : ''}Stock bajo
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--color-muted)' }}>
                {['Insumo', 'Proveedor', 'Unidad', 'Stock actual', 'Mínimo', 'Ajustar', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                    style={{ color: 'var(--color-muted-foreground)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(insumo => (
                <tr key={insumo.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3">
                    <div className="font-medium" style={{ color: 'var(--color-foreground)' }}>{insumo.nombre}</div>
                    {insumo.stockActual <= insumo.stockMinimo && (
                      <div className="text-xs mt-0.5" style={{ color: '#E53935' }}>Stock bajo</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                    {insumo.proveedor || '—'}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{insumo.unidad}</td>
                  <td className="px-4 py-3 w-40">
                    <StockBar actual={insumo.stockActual} minimo={insumo.stockMinimo} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{insumo.stockMinimo}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => ajustarStock(insumo.id, -1)}
                        className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold border hover:opacity-70"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}>−</button>
                      <button onClick={() => ajustarStock(insumo.id, 1)}
                        className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold border hover:opacity-70"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}>+</button>
                      <button onClick={() => ajustarStock(insumo.id, 10)}
                        className="px-2 h-6 rounded flex items-center justify-center text-xs border hover:opacity-70"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}>+10</button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => startEdit(insumo)}
                      className="text-xs hover:opacity-70" style={{ color: 'var(--color-primary)' }}>Editar</button>
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
