import type { EstadoRemito } from '../types';

const CONFIG: Record<EstadoRemito, { label: string; color: string }> = {
  borrador:         { label: 'Borrador',        color: 'bg-[#8C8C7A]/15 text-[#5C5C4A] border-[#8C8C7A]/30' },
  pendiente:        { label: 'Pendiente',        color: 'bg-[#C4761E]/10 text-[#9B5A10] border-[#C4761E]/30' },
  en_camino:        { label: 'En camino',        color: 'bg-[#1F6FAE]/10 text-[#155487] border-[#1F6FAE]/30' },
  entregado:        { label: 'Entregado',        color: 'bg-[#2B6B2B]/10 text-[#1E4E1E] border-[#2B6B2B]/30' },
  con_inconveniente:{ label: 'Con inconveniente',color: 'bg-[#B5392A]/10 text-[#8A2A1E] border-[#B5392A]/30' },
  cancelado:        { label: 'Cancelado',        color: 'bg-[#555550]/10 text-[#3A3A36] border-[#555550]/30' },
};

export function EstadoBadge({ estado }: { estado: EstadoRemito }) {
  const cfg = CONFIG[estado];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

export const ESTADO_CONFIG = CONFIG;
