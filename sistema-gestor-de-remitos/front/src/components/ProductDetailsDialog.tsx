import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function ProductDetailsDialog() {
  const { currentUser, productDetailId, closeProductDetails, productos, recetas } = useApp();
  const navigate = useNavigate();
  const product = productos.find(item => item.id === productDetailId);
  const recipe = recetas.find(item => item.productoId === product?.id);

  useEffect(() => {
    if (!product) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeProductDetails();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [product, closeProductDetails]);

  if (!product) return null;

  const editRecipe = () => {
    closeProductDetails();
    const query = recipe ? `recetaId=${encodeURIComponent(recipe.id)}` : `productoId=${encodeURIComponent(product.id)}`;
    navigate(`/recetas?${query}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={event => {
        if (event.target === event.currentTarget) closeProductDetails();
      }}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-detail-title"
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border p-5 shadow-xl"
        style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="product-detail-title" className="text-xl font-bold" style={{ color: 'var(--color-foreground)' }}>{product.nombre}</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>{product.descripcion || 'Sin descripción'}</p>
          </div>
          <button type="button" onClick={closeProductDetails} className="px-3 py-2 rounded-xl border text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}>
            Cerrar
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4 sm:grid-cols-4">
          <div className="rounded-xl p-3" style={{ background: 'var(--color-muted)' }}><span className="text-xs uppercase" style={{ color: 'var(--color-muted-foreground)' }}>Código</span><div className="font-semibold mt-1">{product.codigo}</div></div>
          <div className="rounded-xl p-3" style={{ background: 'var(--color-muted)' }}><span className="text-xs uppercase" style={{ color: 'var(--color-muted-foreground)' }}>Categoría</span><div className="font-semibold mt-1">{product.categoria}</div></div>
          <div className="rounded-xl p-3" style={{ background: 'var(--color-muted)' }}><span className="text-xs uppercase" style={{ color: 'var(--color-muted-foreground)' }}>Unidad</span><div className="font-semibold mt-1">{product.unidad}</div></div>
          <div className="rounded-xl p-3" style={{ background: 'var(--color-muted)' }}><span className="text-xs uppercase" style={{ color: 'var(--color-muted-foreground)' }}>Precio</span><div className="font-semibold mt-1">${product.precioVenta.toLocaleString('es-AR')}</div></div>
        </div>

        <section className="mt-4 rounded-xl border p-4" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold" style={{ color: 'var(--color-foreground)' }}>Receta</h3>
            {currentUser?.rol === 'admin' && (
              <button type="button" onClick={editRecipe} className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
                {recipe ? 'Editar' : 'Crear receta'}
              </button>
            )}
          </div>
          {recipe ? (
            <>
              <div className="text-sm mt-2" style={{ color: 'var(--color-muted-foreground)' }}>{recipe.rendimiento} {recipe.unidadRendimiento} · {recipe.tiempoPrepMin} min</div>
              <div className="text-sm mt-2 whitespace-pre-wrap" style={{ color: 'var(--color-foreground)' }}>{recipe.instrucciones || 'Sin instrucciones'}</div>
              {recipe.ingredientes.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                  {recipe.ingredientes.map((ingredient, index) => (
                    <li key={`${ingredient.insumoId}-${index}`}>{ingredient.insumoNombre}: {ingredient.cantidad} {ingredient.unidad}</li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="text-sm mt-2" style={{ color: 'var(--color-muted-foreground)' }}>Sin receta definida para este producto.</p>
          )}
        </section>
      </section>
    </div>
  );
}