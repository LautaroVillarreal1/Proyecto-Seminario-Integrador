import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../shared/infrastructure/prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { RemitosService } from './remitos.service';

const partialMatch = (value: Record<string, unknown>): Record<string, unknown> =>
  expect.objectContaining(value) as Record<string, unknown>;

describe('RemitosService', () => {
  const transaction = {
    producto: {
      findUnique: jest.fn().mockResolvedValue({ idProducto: 1, nombre: 'Granola', precioUnitario: 1400, stockActual: 5, activo: true }),
      update: jest.fn().mockResolvedValue({}),
    },
    detalleRemito: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    remito: {
      create: jest.fn().mockResolvedValue({ idRemito: 1, detalles: [] }),
      update: jest.fn().mockResolvedValue({ idRemito: 1 }),
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
    expect(transaction.remito.create).toHaveBeenCalledWith(partialMatch({
      data: partialMatch({ descuento: 350 }),
    }));

    await expect(service.create(createDto(1401), 2)).rejects.toThrow(BadRequestException);
    expect(transaction.remito.create).toHaveBeenCalledTimes(1);
  });

  it('creates a stock-shortage remito as pending without decrementing stock', async () => {
    transaction.producto.findUnique.mockResolvedValue({ idProducto: 1, nombre: 'Granola', precioUnitario: 1400, stockActual: 2, activo: true });
    const dto = { ...createDto(0), confirmarFaltantes: true, detalles: [{ idProducto: 1, cantidad: 5 }] };

    const created = await service.create(dto, 2);

    expect(transaction.remito.create).toHaveBeenCalledWith(partialMatch({
      data: partialMatch({ idEstado: 4, observacion: 'Falta:\n3 Granola' }),
    }));
    expect(created.faltantes).toEqual([{ idProducto: 1, nombre: 'Granola', cantidad: 3 }]);
    expect(transaction.producto.update).not.toHaveBeenCalled();
  });

  it('requires confirmation before creating a remito with stock shortages', async () => {
    transaction.producto.findUnique.mockResolvedValueOnce({ idProducto: 1, nombre: 'Granola', precioUnitario: 1400, stockActual: 2, activo: true });

    await expect(service.create({ ...createDto(0), detalles: [{ idProducto: 1, cantidad: 5 }] }, 2))
      .rejects.toMatchObject({ response: { faltantes: [{ idProducto: 1, nombre: 'Granola', cantidad: 3 }] } });
    expect(transaction.remito.create).not.toHaveBeenCalled();
  });

  it('reports aggregated shortages for every insufficient product', async () => {
    transaction.producto.findUnique
      .mockResolvedValueOnce({ idProducto: 1, nombre: 'Granola', precioUnitario: 1400, stockActual: 2, activo: true })
      .mockResolvedValueOnce({ idProducto: 1, nombre: 'Granola', precioUnitario: 1400, stockActual: 2, activo: true })
      .mockResolvedValueOnce({ idProducto: 2, nombre: 'Yogur', precioUnitario: 950, stockActual: 1, activo: true });
    const dto = {
      ...createDto(0),
      confirmarFaltantes: true,
      detalles: [{ idProducto: 1, cantidad: 2 }, { idProducto: 1, cantidad: 3 }, { idProducto: 2, cantidad: 4 }],
    };

    const created = await service.create(dto, 2);

    expect(created.faltantes).toEqual([
      { idProducto: 1, nombre: 'Granola', cantidad: 3 },
      { idProducto: 2, nombre: 'Yogur', cantidad: 3 },
    ]);
    expect(transaction.producto.update).not.toHaveBeenCalled();
  });

  it('does not confirm a stock-shortage remito until all products are available', async () => {
    (prisma.remito.findUnique as jest.Mock).mockResolvedValueOnce({ ...remitoRecord, idEstado: 4, observacion: 'Falta:\n1 Granola' });
    transaction.detalleRemito.findMany.mockResolvedValue([{ idProducto: 1, cantidad: 3, producto: { idProducto: 1, nombre: 'Granola', stockActual: 2 } }]);

    await expect(service.update(1, { idEstado: 8 }, 2, 1)).rejects.toThrow('Stock insuficiente para Granola');
    expect(transaction.producto.update).not.toHaveBeenCalled();
    expect(transaction.remito.update).not.toHaveBeenCalled();
  });

  it('deducts stock when an administrator confirms a stock-shortage remito', async () => {
    (prisma.remito.findUnique as jest.Mock).mockResolvedValueOnce({ ...remitoRecord, idEstado: 4, observacion: 'Falta:\n1 Granola' });
    transaction.detalleRemito.findMany.mockResolvedValue([{ idProducto: 1, cantidad: 3, producto: { idProducto: 1, nombre: 'Granola', stockActual: 3 } }]);

    await service.update(1, { idEstado: 8 }, 2, 1);

    expect(transaction.producto.update).toHaveBeenCalledWith({ where: { idProducto: 1 }, data: { stockActual: { decrement: 3 } } });
    expect(transaction.remito.update).toHaveBeenCalled();
  });
});