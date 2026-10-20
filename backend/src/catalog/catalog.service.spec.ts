import { ConflictException } from '@nestjs/common';
import { PrismaService } from '../shared/infrastructure/prisma/prisma.service';
import { CatalogService } from './catalog.service';

describe('CatalogService categories', () => {
  const prisma = {
    categoria: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    producto: { count: jest.fn() },
  };
  const service = new CatalogService(prisma as unknown as PrismaService);

  beforeEach(() => jest.clearAllMocks());

  it('normalizes and stores category names', async () => {
    prisma.categoria.findUnique.mockResolvedValue(null);
    prisma.categoria.create.mockImplementation(({ data }) => Promise.resolve({ idCategoria: 4, ...data }));

    await expect(service.crearCategoria({ nombre: '  QUESOS   FRESCOS ' })).resolves.toEqual({
      idCategoria: 4,
      nombre: 'quesos frescos',
    });
    expect(prisma.categoria.create).toHaveBeenCalledWith({ data: { nombre: 'quesos frescos' } });
  });

  it('maps known singular aliases to the existing plural category', async () => {
    prisma.categoria.findUnique.mockResolvedValue({ idCategoria: 1, nombre: 'yogures' });

    await expect(service.crearCategoria({ nombre: 'Yogur' })).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.categoria.create).not.toHaveBeenCalled();
  });

  it('prevents deleting a category that still has products', async () => {
    prisma.categoria.findUnique.mockResolvedValue({ idCategoria: 1, nombre: 'yogures' });
    prisma.producto.count.mockResolvedValue(2);

    await expect(service.eliminarCategoria(1)).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.categoria.delete).not.toHaveBeenCalled();
  });
});
