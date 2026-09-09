import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Usuario, Remito, Producto, Insumo, Receta } from '../types';
import { USUARIOS, REMITOS, PRODUCTOS, INSUMOS, RECETAS } from '../data/mock';

interface AppContextType {
  currentUser: Usuario | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  usuarios: Usuario[];
  remitos: Remito[];
  setRemitos: (r: Remito[]) => void;
  addRemito: (r: Remito) => void;
  updateRemito: (r: Remito) => void;
  productos: Producto[];
  setProductos: (p: Producto[]) => void;
  insumos: Insumo[];
  setInsumos: (i: Insumo[]) => void;
  recetas: Receta[];
  setRecetas: (r: Receta[]) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [remitos, setRemitos] = useState<Remito[]>(REMITOS);
  const [productos, setProductos] = useState<Producto[]>(PRODUCTOS);
  const [insumos, setInsumos] = useState<Insumo[]>(INSUMOS);
  const [recetas, setRecetas] = useState<Receta[]>(RECETAS);

  const login = (email: string, _password: string) => {
    const user = USUARIOS.find(u => u.email === email && u.activo);
    if (user) { setCurrentUser(user); return true; }
    return false;
  };

  const logout = () => setCurrentUser(null);

  const addRemito = (r: Remito) => setRemitos(prev => [...prev, r]);
  const updateRemito = (r: Remito) =>
    setRemitos(prev => prev.map(x => (x.id === r.id ? r : x)));

  return (
    <AppContext.Provider value={{
      currentUser, login, logout, usuarios: USUARIOS,
      remitos, setRemitos, addRemito, updateRemito,
      productos, setProductos,
      insumos, setInsumos,
      recetas, setRecetas,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
