import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/infrastructure/prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

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
      result[key].total += remito.detalles.reduce((sum, detail) => sum + Number(detail.subTotal), 0);
      return result;
    }, {});

    return {
      totalRemitos: remitos.length,
      porEstado: byState,
      entregados: remitos.filter(remito => ['Firmado', 'Cobrado', 'Entregado'].includes(remito.estado.nombre)).length,
    };
  }
}