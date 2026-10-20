import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { normalizeCategoryName } from '../utils/categories';

export default function Categorias() {
  const { categorias, productos, crearCategoria, actualizarCategoria, eliminarCategoria, notifyError } = useApp();
  const [nombre, setNombre] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const cancel = () => {
    setShowForm(false);
    setEditId(null);
    setNombre('');
  };

  const save = async () => {
    const normalized = normalizeCategoryName(nombre);
    if (!normalized) {
      notifyError('El nombre de la categoría es obligatorio.');
      return;
    }
    if (categorias.some(category => category.idCategoria !== editId && normalizeCategoryName(category.nombre) === normalized)) {
      notifyError('Ya existe una categoría con ese nombre.');
      return;
    }

    const saved = editId === null
      ? await crearCategoria(normalized)
      : await actualizarCategoria(editId, normalized);
    if (!saved) return;
    cancel();
  };

  const edit = (idCategoria: number, currentName: string) => {
    setEditId(idCategoria);
    setNombre(currentName);
    setShowForm(true);
  };

  return (
    <div className="mx-auto max-w-7xl p-6 lg:p-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "'Baloo 2', 'Inter', sans-serif", color: 'var(--color-foreground)' }}>Categorías</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>{categorias.length} categorías</p>
        </div>
        <button onClick={() => { setEditId(null); setNombre(''); setShowForm(true); }}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
          + Nueva categoría
        </button>
      </div>

      {showForm && (
        <section className="mb-6 rounded-2xl border p-5" style={{ background: 'var(--color-card)', borderColor: 'var(--color-accent)' }}>
          <h2 className="mb-4 text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>
            {editId === null ? 'Nueva categoría' : 'Editar categoría'}
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex-1">
              <span className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--color-foreground)' }}>Nombre *</span>
              <input autoFocus value={nombre} onChange={event => setNombre(event.target.value)} onKeyDown={event => {
                if (event.key === 'Enter') void save();
              }} className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }} />
            </label>
            <div className="flex items-end gap-2">
              <button onClick={() => void save()} className="rounded-xl px-4 py-2 text-sm font-semibold"
                style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>Guardar</button>
              <button onClick={cancel} className="rounded-xl border px-4 py-2 text-sm"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}>Cancelar</button>
            </div>
          </div>
          <p className="mt-2 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>Se guardará en minúsculas y sin espacios sobrantes.</p>
        </section>
      )}

      <div className="overflow-hidden rounded-2xl border" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--color-muted)' }}>
                {['Categoría', 'Productos asociados', 'Acciones'].map(heading => (
                  <th key={heading} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--color-muted-foreground)' }}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categorias.map(category => {
                const productCount = productos.filter(product => product.idCategoria === category.idCategoria).length;
                return (
                  <tr key={category.idCategoria} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-foreground)' }}>{category.nombre}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-muted-foreground)' }}>{productCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => edit(category.idCategoria, category.nombre)} className="rounded-lg border px-3 py-1.5 text-xs font-medium"
                          style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}>Editar</button>
                        <button onClick={() => void eliminarCategoria(category.idCategoria)} disabled={productCount > 0}
                          title={productCount > 0 ? 'No se puede eliminar mientras tenga productos asociados.' : 'Eliminar categoría'}
                          className="rounded-lg border px-3 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40"
                          style={{ borderColor: 'var(--color-border)', color: '#B42318' }}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {categorias.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--color-muted-foreground)' }}>No hay categorías disponibles.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
