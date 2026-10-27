import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/infrastructure/prisma/prisma.service';

@Injectable()
export class ReportsService {
  /** Recibe Prisma para consultar los remitos incluidos en el informe. */
  constructor(private readonly prisma: PrismaService) {}

  /** Resume cantidades y totales por estado, además de contar los remitos entregados. */
  async summary(desde?: string, hasta?: string) {
    const remitos = await this.prisma.remito.findMany({
      where: {
        ...(desde || hasta ? { fechaEntrega: { ...(desde ? { gte: new Date(desde) } : {}), ...(hasta ? { lte: new Date(hasta) } : {}) } } : {}),
      },
      include: { estado: true, usuario: true, detalles: true },
    });

    const byState = remitos.reduce<Record<string, { cantidad: number; total: number }>>((result, remito) => {
      const key = remito.estado.nombre;
      result[key] ??= { cantidad: 0, total: 0 };
      result[key].cantidad += 1;
      const subtotal = remito.detalles.reduce((sum, detail) => sum + Number(detail.subTotal), 0);
      result[key].total += subtotal - Number(remito.descuento);
      return result;
    }, {});

    return {
      totalRemitos: remitos.length,
      porEstado: byState,
      entregados: remitos.filter(remito => ['Firmado', 'Cobrado', 'Entregado'].includes(remito.estado.nombre)).length,
    };
  }
}