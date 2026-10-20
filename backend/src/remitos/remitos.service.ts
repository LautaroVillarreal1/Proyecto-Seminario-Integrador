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
    const { remito: created, faltantes } = await this.prisma.$transaction(async tx => {
      const products = await Promise.all(dto.detalles.map(detail => tx.producto.findUnique({ where: { idProducto: detail.idProducto } })));
      if (products.some(product => !product)) throw new NotFoundException('Producto inexistente');
      if (products.some(product => !product!.activo)) throw new ConflictException('No se pueden incluir productos inactivos');
      const requestedByProduct = new Map<number, number>();
      for (const detail of dto.detalles) requestedByProduct.set(detail.idProducto, (requestedByProduct.get(detail.idProducto) ?? 0) + detail.cantidad);
      const productById = new Map(products.map(product => [product!.idProducto, product!]));
      const faltantes = Array.from(requestedByProduct, ([productId, quantity]) => {
        const product = productById.get(productId)!;
        const missing = quantity - product.stockActual;
        return missing > 0 ? { idProducto: productId, nombre: product.nombre, cantidad: missing } : null;
      }).filter((shortage): shortage is { idProducto: number; nombre: string; cantidad: number } => shortage !== null);
      if (faltantes.length > 0 && !dto.confirmarFaltantes) {
        throw new ConflictException({
          message: 'Hay productos con stock insuficiente. Confirmá la creación para continuar.',
          faltantes,
        });
      }
      const subtotal = dto.detalles.reduce((sum, detail, index) => sum + Number(products[index]!.precioUnitario) * detail.cantidad, 0);
      const descuento = dto.descuento ?? 0;
      if (descuento > subtotal) throw new BadRequestException('El descuento no puede superar el subtotal del remito');
      const observacion = faltantes.length > 0
        ? [`Falta:\n${faltantes.map(shortage => `${shortage.cantidad} ${shortage.nombre}`).join('\n')}`, dto.observacion?.trim()].filter(Boolean).join('\n')
        : dto.observacion;
      const remito = await tx.remito.create({ data: { fechaEntrega: new Date(dto.fechaEntrega), horaEntrega: new Date(dto.horaEntrega), idUsuario: dto.idResponsableEntrega ?? userId, idEstado: faltantes.length > 0 ? 4 : dto.idEstado, idCliente: dto.idCliente, observacion, descuento, detalles: { create: dto.detalles.map((detail, index) => ({ idProducto: detail.idProducto, cantidad: detail.cantidad, subTotal: Number(products[index]!.precioUnitario) * detail.cantidad })) } }, include: { detalles: true } });
      if (faltantes.length === 0) {
        await Promise.all(dto.detalles.map(detail => tx.producto.update({ where: { idProducto: detail.idProducto }, data: { stockActual: { decrement: detail.cantidad } } })));
      }
      return { remito, faltantes };
    });
    const complete = await this.find(created.idRemito);
    this.realtime.publishRemito(complete as unknown as Record<string, unknown>);
    return { ...complete, faltantes };
  }

  async update(id: number, dto: UpdateRemitoDto, userId: number, roleId: number) {
    const current = await this.find(id);
    if (roleId === 3 && current.idUsuario !== userId) throw new ForbiddenException('El remito no esta asignado al viajante');
    const data = { ...dto, fechaEntregaReal: dto.fechaEntregaReal ? new Date(dto.fechaEntregaReal) : undefined };
    const isStockShortageConfirmation = current.idEstado === 4 && dto.idEstado === 8 && current.observacion?.startsWith('Falta:\n');
    if (isStockShortageConfirmation && roleId === 3) throw new ForbiddenException('Solo un administrador puede confirmar un remito pendiente por falta de stock');
    const updated = isStockShortageConfirmation
      ? await this.prisma.$transaction(async tx => {
        const details = await tx.detalleRemito.findMany({ where: { idRemito: id }, include: { producto: true } });
        const requestedByProduct = new Map<number, { quantity: number; product: typeof details[number]['producto'] }>();
        for (const detail of details) {
          const requested = requestedByProduct.get(detail.idProducto);
          requestedByProduct.set(detail.idProducto, { quantity: (requested?.quantity ?? 0) + detail.cantidad, product: detail.producto });
        }
        for (const { quantity, product } of requestedByProduct.values()) {
          if (product.stockActual < quantity) throw new ConflictException(`Stock insuficiente para ${product.nombre}`);
        }
        await Promise.all(Array.from(requestedByProduct, ([idProducto, { quantity }]) => tx.producto.update({ where: { idProducto }, data: { stockActual: { decrement: quantity } } })));
        return tx.remito.update({ where: { idRemito: id }, data, include: { cliente: { include: { provincia: true } }, estado: true, usuario: true, detalles: { include: { producto: true } } } });
      })
      : await this.prisma.remito.update({ where: { idRemito: id }, data, include: { cliente: { include: { provincia: true } }, estado: true, usuario: true, detalles: { include: { producto: true } } } });
    this.realtime.publishRemito(updated as unknown as Record<string, unknown>);
    return updated;
  }
}