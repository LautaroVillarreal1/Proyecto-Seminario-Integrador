import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import frulattiLogo from '../assets/frulatti-logo-sin-fondo (1).png';

export default function Login() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
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
      <aside className="panel-marca">
        <div className="marca-top">
          <div className="isotipo">
            <img src={frulattiLogo} alt="Frulatti" className="splash" />
            <span className="marca-nombre">Frulatti</span>
          </div>
        </div>

        <section className="marca-mensaje">
          <h1>Tu opción rica y saludable, todo el año.</h1>
          <p>
            Ingresá a tu cuenta para gestionar tus pedidos, seguir tus envíos y descubrir nuestros yogures y kéfires artesanales.
          </p>
        </section>

        <section className="marca-footer">
          <span>+54 9353-4286502</span>
          <span>frulattivm@gmail.com</span>
        </section>
      </aside>

      <main className="panel-form">
        <section className="form-contenedor">
          <h2>Iniciar sesión</h2>
          <p className="sub">
            ¿Todavía no tenés cuenta? <a href="#">Creá una acá</a>
          </p>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="campo">
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

            <div className="campo">
              <div className="campo-pass-header">
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

            <div className="recordar">
              <input type="checkbox" id="recordar" />
              <label htmlFor="recordar">Recordarme en este dispositivo</label>
            </div>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="btn-ingresar">
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </button>

            <div className="divisor">o continuá con</div>

            <button type="button" className="btn-whatsapp">
              Ingresar con Google
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}