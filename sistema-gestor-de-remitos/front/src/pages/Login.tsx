import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Login() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const DEMO_ACCOUNTS = [
    { label: 'Admin — Laura Martínez', email: 'laura@lacteos.com' },
    { label: 'Viajante — Sergio Bello', email: 'sergio@lacteos.com' },
    { label: 'Viajante — Marcos Díaz', email: 'marcos@lacteos.com' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (login(email, password)) {
      navigate('/');
    } else {
      setError('Email no encontrado o cuenta inactiva.');
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-sidebar)' }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-96 p-12" style={{ background: 'var(--color-sidebar)' }}>
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
              style={{ background: 'var(--color-accent)' }}>L</div>
            <span className="text-white font-semibold tracking-wide text-lg">LácteosNaturales</span>
          </div>
          <h1 className="text-4xl leading-snug font-[var(--font-display)] italic"
            style={{ color: 'var(--color-sidebar-foreground)', fontFamily: 'var(--font-display)' }}>
            Gestión de entregas y producción
          </h1>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: 'rgba(212,232,194,0.65)' }}>
            Seguimiento de remitos, inventario de insumos, recetas y reportes. Acceso desde computadora y celular.
          </p>
        </div>
        <p className="text-xs" style={{ color: 'rgba(212,232,194,0.4)' }}>
          © 2026 LácteosNaturales
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6"
        style={{ background: 'var(--color-background)' }}>
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-3"
              style={{ background: 'var(--color-accent)' }}>L</div>
            <span className="font-semibold text-xl" style={{ color: 'var(--color-foreground)' }}>LácteosNaturales</span>
          </div>

          <h2 className="text-2xl font-semibold mb-1" style={{ color: 'var(--color-foreground)' }}>
            Iniciar sesión
          </h2>
          <p className="text-sm mb-8" style={{ color: 'var(--color-muted-foreground)' }}>
            Ingresá con tu cuenta para continuar.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="usuario@lacteos.com"
                className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all"
                style={{
                  background: 'var(--color-card)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-foreground)',
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="cualquier valor (demo)"
                className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all"
                style={{
                  background: 'var(--color-card)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-foreground)',
                }}
              />
            </div>

            {error && (
              <p className="text-sm rounded-lg px-3 py-2" style={{ background: '#FEE2E2', color: '#991B1B' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
              Ingresar
            </button>
          </form>

          <div className="mt-8 p-4 rounded-xl border" style={{ background: 'var(--color-muted)', borderColor: 'var(--color-border)' }}>
            <p className="text-xs font-semibold mb-3" style={{ color: 'var(--color-muted-foreground)' }}>
              CUENTAS DE DEMO
            </p>
            <div className="space-y-1.5">
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => { setEmail(acc.email); setPassword('demo'); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs transition-colors hover:opacity-80"
                  style={{ background: 'var(--color-card)', color: 'var(--color-foreground)', borderColor: 'var(--color-border)' }}>
                  {acc.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
