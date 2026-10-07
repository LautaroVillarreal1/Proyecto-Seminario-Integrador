import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/infrastructure/prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { CreateRemitoDto, RemitoFilterDto, UpdateRemitoDto } from './dto';

@Injectable()
export class RemitosService {
  constructor(private readonly prisma: PrismaService, private readonly realtime: RealtimeService) {}

  list(filters: RemitoFilterDto, userId?: number) {
    const where: any = {
      ...(userId ? { idUsuario: userId } : {}),
      ...(filters.idCliente ? { idCliente: filters.idCliente } : {}),
      ...(filters.idEstado ? { idEstado: filters.idEstado } : {}),
      ...(filters.desde || filters.hasta ? { fechaEntrega: { ...(filters.desde ? { gte: new Date(filters.desde) } : {}), ...(filters.hasta ? { lte: new Date(filters.hasta) } : {}) } } : {}),
      ...(filters.precioMin || filters.precioMax ? { detalles: { some: { subTotal: { ...(filters.precioMin ? { gte: filters.precioMin } : {}), ...(filters.precioMax ? { lte: filters.precioMax } : {}) } } } } : {}),
      ...(filters.idProducto ? { detalles: { some: { idProducto: filters.idProducto } } } : {}),
      ...(filters.localidad || filters.provincia ? { cliente: { ...(filters.provincia ? { provincia: { nombre: { contains: filters.provincia, mode: 'insensitive' } } } : {}), ...(filters.localidad ? { direccion: { contains: filters.localidad, mode: 'insensitive' } } : {}) } } : {}),
    };
    return this.prisma.remito.findMany({ where, include: { cliente: { include: { provincia: true } }, estado: true, usuario: true, detalles: { include: { producto: true } } }, orderBy: { fechaEntrega: 'desc' } });
  }

  async find(id: number) {
    const remito = await this.prisma.remito.findUnique({ where: { idRemito: id }, include: { cliente: true, estado: true, usuario: true, detalles: { include: { producto: true } } } });
    if (!remito) throw new NotFoundException('Remito inexistente');
    return remito;
  }

  async create(dto: CreateRemitoDto, userId: number) {
    if (!dto.idResponsableEntrega) throw new BadRequestException('Es necesario asignar viajante al remito');
    if (!dto.detalles?.length) throw new BadRequestException('El remito debe tener productos');
    const created = await this.prisma.$transaction(async tx => {
      const products = await Promise.all(dto.detalles.map(detail => tx.producto.findUnique({ where: { idProducto: detail.idProducto } })));
      if (products.some(product => !product)) throw new NotFoundException('Producto inexistente');
      if (products.some(product => !product!.activo)) throw new ConflictException('No se pueden incluir productos inactivos');
      for (let index = 0; index < dto.detalles.length; index += 1) {
        const product = products[index]!;
        if (product.stockActual < dto.detalles[index].cantidad) throw new ConflictException(`Stock insuficiente para ${product.nombre}`);
      }
      const subtotal = dto.detalles.reduce((sum, detail, index) => sum + Number(products[index]!.precioUnitario) * detail.cantidad, 0);
      const descuento = dto.descuento ?? 0;
      if (descuento > subtotal) throw new BadRequestException('El descuento no puede superar el subtotal del remito');
      const remito = await tx.remito.create({ data: { fechaEntrega: new Date(dto.fechaEntrega), horaEntrega: new Date(dto.horaEntrega), idUsuario: dto.idResponsableEntrega ?? userId, idEstado: dto.idEstado, idCliente: dto.idCliente, observacion: dto.observacion, descuento, detalles: { create: dto.detalles.map((detail, index) => ({ idProducto: detail.idProducto, cantidad: detail.cantidad, subTotal: Number(products[index]!.precioUnitario) * detail.cantidad })) } }, include: { detalles: true } });
      await Promise.all(dto.detalles.map(detail => tx.producto.update({ where: { idProducto: detail.idProducto }, data: { stockActual: { decrement: detail.cantidad } } })));
      return remito;
    });
    const complete = await this.find(created.idRemito);
    this.realtime.publishRemito(complete as unknown as Record<string, unknown>);
    return complete;
  }

  async update(id: number, dto: UpdateRemitoDto, userId: number, roleId: number) {
    const current = await this.find(id);
    if (roleId === 3 && current.idUsuario !== userId) throw new ForbiddenException('El remito no esta asignado al viajante');
    const updated = await this.prisma.remito.update({ where: { idRemito: id }, data: { ...dto, fechaEntregaReal: dto.fechaEntregaReal ? new Date(dto.fechaEntregaReal) : undefined }, include: { cliente: { include: { provincia: true } }, estado: true, usuario: true, detalles: { include: { producto: true } } } });
    this.realtime.publishRemito(updated as unknown as Record<string, unknown>);
    return updated;
  }
}