import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../shared/infrastructure/prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { RemitosService } from './remitos.service';

describe('RemitosService', () => {
  const transaction = {
    producto: {
      findUnique: jest.fn().mockResolvedValue({ precioUnitario: 1400, stockActual: 5, activo: true }),
      update: jest.fn().mockResolvedValue({}),
    },
    remito: {
      create: jest.fn().mockResolvedValue({ idRemito: 1, detalles: [] }),
    },
  };
  const remitoRecord = {
    idRemito: 1,
    fechaEntrega: new Date('2026-10-06T10:00:00.000Z'),
    idEstado: 1,
    idCliente: 1,
    descuento: 350,
    detalles: [],
  };
  const prisma = {
    $transaction: jest.fn((callback: (tx: typeof transaction) => Promise<unknown>) => callback(transaction)),
    remito: { findUnique: jest.fn().mockResolvedValue(remitoRecord) },
  } as unknown as PrismaService;
  const realtime = { publishRemito: jest.fn() } as unknown as RealtimeService;
  const service = new RemitosService(prisma, realtime);

  const createDto = (descuento: number) => ({
    fechaEntrega: '2026-10-06T10:00:00.000Z',
    horaEntrega: '2026-10-06T10:00:00.000Z',
    idEstado: 1,
    idCliente: 1,
    idResponsableEntrega: 2,
    descuento,
    detalles: [{ idProducto: 1, cantidad: 1 }],
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('persists the discount amount and rejects discounts above the subtotal', async () => {
    await service.create(createDto(350), 2);
    expect(transaction.remito.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ descuento: 350 }),
    }));

    await expect(service.create(createDto(1401), 2)).rejects.toThrow(BadRequestException);
    expect(transaction.remito.create).toHaveBeenCalledTimes(1);
  });
});