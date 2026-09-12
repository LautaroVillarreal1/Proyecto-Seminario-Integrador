import type { EstadoRemito } from '../types';

const CONFIG: Record<EstadoRemito, { label: string; color: string }> = {
  borrador:         { label: 'Borrador',        color: 'bg-[#8C8C7A]/15 text-[#5C5C4A] border-[#8C8C7A]/30' },
  pendiente:        { label: 'Pendiente',        color: 'bg-[#D9A441]/10 text-[#8A671F] border-[#D9A441]/30' },
  en_camino:        { label: 'En camino',        color: 'bg-[#4F9B4F]/10 text-[#2F6D2F] border-[#4F9B4F]/30' },
  entregado:        { label: 'Entregado',        color: 'bg-[#3F7D3F]/10 text-[#2B602B] border-[#3F7D3F]/30' },
  con_inconveniente:{ label: 'Con inconveniente',color: 'bg-[#E53935]/10 text-[#B32623] border-[#E53935]/30' },
  cancelado:        { label: 'Cancelado',        color: 'bg-[#667066]/10 text-[#465046] border-[#667066]/30' },
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
