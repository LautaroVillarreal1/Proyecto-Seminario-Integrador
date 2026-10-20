import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import frulattiLogo from '../assets/frulatti-logo-sin-fondo.png';

export default function Login() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (await login(email, password)) {
      navigate('/');
    } else {
      setError('Email no encontrado o cuenta inactiva.');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <aside className="login-brand-panel">
        <div className="login-brand-top">
          <div className="login-logo-wrap">
            <img src={frulattiLogo} alt="Frulatti" className="login-logo" />
            <span className="login-brand-name">Frulatti</span>
          </div>
        </div>

        <section className="login-brand-message">
          <h1>Tu opción rica y saludable, todo el año.</h1>
        </section>

        <section className="login-brand-footer">
          <span>+54 9353-4286502</span>
          <span>frulattivm@gmail.com</span>
        </section>
      </aside>

      <main className="login-form-panel">
        <section className="login-form-card">
          <div className="login-title-wrap">
            <h2>Iniciar sesión</h2>
            <p className="login-subtitle">
              ¿Todavía no tenés cuenta? <a href="#">Creá una acá</a>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="email">Correo electrónico</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tuemail@ejemplo.com"
              />
            </div>

            <div className="login-field">
              <div className="field-pass-header">
                <label htmlFor="password">Contraseña</label>
                <a href="#">¿Olvidaste tu contraseña?</a>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Ingresá tu contraseña"
              />
            </div>

            <div className="login-remember">
              <input type="checkbox" id="recordar" />
              <label htmlFor="recordar">Recordarme en este dispositivo</label>
            </div>

            {error && (
              <p className="login-error">
                {error}
              </p>
            )}

            <button type="submit" className="login-submit">
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </button>

            <div className="login-divisor">o continuá con</div>

            <button type="button" className="login-google">
              Ingresar con Google
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
