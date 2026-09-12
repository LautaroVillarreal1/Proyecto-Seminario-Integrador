import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/infrastructure/prisma/prisma.service';
import { CreateClienteDto, CreateInsumoDto, CreateProductoDto } from './dto';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  productos() { return this.prisma.producto.findMany({ include: { categoria: true, unidadDeMedida: true, receta: true }, orderBy: { nombre: 'asc' } }); }
  producto(id: number) { return this.prisma.producto.findUnique({ where: { idProducto: id }, include: { categoria: true, unidadDeMedida: true, receta: true } }); }
  crearProducto(dto: CreateProductoDto) { return this.prisma.producto.create({ data: { ...dto, precioUnitario: dto.precioUnitario, idreceta: dto.idreceta ?? null, stockActual: dto.stockActual ?? 0, stockMinimo: dto.stockMinimo ?? 0, activo: dto.activo ?? true } }); }
  actualizarProducto(id: number, dto: Partial<CreateProductoDto>) { return this.prisma.producto.update({ where: { idProducto: id }, data: dto }); }

  insumos() { return this.prisma.insumo.findMany({ include: { unidadDeMedida: true }, orderBy: { nombre: 'asc' } }); }
  crearInsumo(dto: CreateInsumoDto) { return this.prisma.insumo.create({ data: { ...dto, stockActual: dto.stockActual ?? 0, stockMinimo: dto.stockMinimo ?? 0, costoUnitario: dto.costoUnitario ?? 0 } }); }
  actualizarInsumo(id: number, dto: Partial<CreateInsumoDto>) { return this.prisma.insumo.update({ where: { idInsumo: id }, data: dto }); }
  ajustarInsumo(id: number, cantidad: number) { return this.prisma.insumo.update({ where: { idInsumo: id }, data: { stockActual: { increment: cantidad } } }); }

  clientes() { return this.prisma.cliente.findMany({ include: { provincia: true }, orderBy: { nombre: 'asc' } }); }
  crearCliente(dto: CreateClienteDto) { return this.prisma.cliente.create({ data: dto }); }
  actualizarCliente(id: number, dto: Partial<CreateClienteDto>) { return this.prisma.cliente.update({ where: { idCliente: id }, data: dto }); }
}