import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const NAV_ADMIN = [
  { to: '/', label: 'Dashboard', icon: '⊞', exact: true },
  { to: '/remitos', label: 'Remitos', icon: '📋' },
  { to: '/productos', label: 'Productos', icon: '🥛' },
  { to: '/inventario', label: 'Inventario', icon: '📦' },
  { to: '/recetas', label: 'Recetas', icon: '📖' },
  { to: '/informes', label: 'Informes', icon: '📊' },
];

const NAV_VIAJANTE = [
  { to: '/mis-remitos', label: 'Mis Remitos', icon: '📋', exact: true },
];

function NavItem({ to, label, icon, exact }: { to: string; label: string; icon: string; exact?: boolean }) {
  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
          isActive
            ? 'bg-white/15 text-white'
            : 'text-[#A8C896] hover:bg-white/8 hover:text-white'
        }`
      }>
      <span className="text-base w-5 text-center">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

export default function Layout() {
  const { currentUser, logout } = useApp();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = currentUser?.rol === 'admin' ? NAV_ADMIN : NAV_VIAJANTE;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 flex items-center gap-3 border-b border-white/10">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ background: 'var(--color-accent)' }}>L</div>
        <div>
          <div className="text-white font-semibold text-sm leading-none">LácteosNaturales</div>
          <div className="text-xs mt-0.5" style={{ color: 'rgba(168,200,150,0.65)' }}>
            {currentUser?.rol === 'admin' ? 'Administración' : 'Viajante'}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(item => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: 'var(--color-accent)', color: 'white' }}>
            {currentUser?.nombre.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{currentUser?.nombre}</div>
            <div className="text-xs truncate" style={{ color: 'rgba(168,200,150,0.65)' }}>{currentUser?.email}</div>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs px-2 py-1 rounded-lg transition-colors hover:bg-white/10"
            style={{ color: 'rgba(168,200,150,0.8)' }}
            title="Cerrar sesión">
            ⏻
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-background)' }}>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0"
        style={{ background: 'var(--color-sidebar)' }}>
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 flex flex-col z-50" style={{ background: 'var(--color-sidebar)' }}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b"
          style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 text-lg">
            ☰
          </button>
          <span className="font-semibold text-sm" style={{ color: 'var(--color-foreground)' }}>
            LácteosNaturales
          </span>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
