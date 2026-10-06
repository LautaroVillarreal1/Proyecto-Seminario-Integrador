import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/infrastructure/prisma/prisma.service';
import { CreateClienteDto, CreateInsumoDto, CreateProductoDto } from './dto';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  private async translateDatabaseError<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === 'P2025') throw new NotFoundException('Recurso inexistente');
      if (code === 'P2002') throw new ConflictException('El recurso ya existe');
      if (code === 'P2003') throw new BadRequestException('La referencia indicada no existe');
      throw error;
    }
  }

  productos() { return this.prisma.producto.findMany({ include: { categoria: true, unidadDeMedida: true, receta: true }, orderBy: { nombre: 'asc' } }); }
  async producto(id: number) {
    const producto = await this.prisma.producto.findUnique({ where: { idProducto: id }, include: { categoria: true, unidadDeMedida: true, receta: true } });
    if (!producto) throw new NotFoundException('Producto inexistente');
    return producto;
  }
  crearProducto(dto: CreateProductoDto) { return this.translateDatabaseError(() => this.prisma.producto.create({ data: { ...dto, precioUnitario: dto.precioUnitario, idreceta: dto.idreceta ?? null, stockActual: dto.stockActual ?? 0, stockMinimo: dto.stockMinimo ?? 0, activo: dto.activo ?? true } })); }
  actualizarProducto(id: number, dto: Partial<CreateProductoDto>) { return this.translateDatabaseError(() => this.prisma.producto.update({ where: { idProducto: id }, data: dto })); }

  insumos() { return this.prisma.insumo.findMany({ include: { unidadDeMedida: true }, orderBy: { nombre: 'asc' } }); }
  crearInsumo(dto: CreateInsumoDto) { return this.translateDatabaseError(() => this.prisma.insumo.create({ data: { ...dto, stockActual: dto.stockActual ?? 0, stockMinimo: dto.stockMinimo ?? 0, costoUnitario: dto.costoUnitario ?? 0 } })); }
  actualizarInsumo(id: number, dto: Partial<CreateInsumoDto>) { return this.translateDatabaseError(() => this.prisma.insumo.update({ where: { idInsumo: id }, data: dto })); }
  ajustarInsumo(id: number, cantidad: number) { return this.translateDatabaseError(() => this.prisma.insumo.update({ where: { idInsumo: id }, data: { stockActual: { increment: cantidad } } })); }

  clientes() { return this.prisma.cliente.findMany({ include: { provincia: true }, orderBy: { nombre: 'asc' } }); }
  crearCliente(dto: CreateClienteDto) { return this.translateDatabaseError(() => this.prisma.cliente.create({ data: dto })); }
  actualizarCliente(id: number, dto: Partial<CreateClienteDto>) { return this.translateDatabaseError(() => this.prisma.cliente.update({ where: { idCliente: id }, data: dto })); }
}