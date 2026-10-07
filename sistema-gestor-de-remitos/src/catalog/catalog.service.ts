import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/infrastructure/prisma/prisma.service';
import { CreateClienteDto, CreateInsumoDto, CreateProductoDto } from './dto';

const normalizeText = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toLowerCase();
const normalizePhone = (value: string) => value.replace(/\D/g, '');

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
  actualizarProducto(id: number, dto: Partial<CreateProductoDto>) {
    if (dto.precioUnitario !== undefined && (!Number.isFinite(dto.precioUnitario) || dto.precioUnitario < 0)) {
      throw new BadRequestException('El precio de venta no puede ser negativo');
    }
    return this.translateDatabaseError(() => this.prisma.producto.update({ where: { idProducto: id }, data: dto }));
  }

  insumos() { return this.prisma.insumo.findMany({ include: { unidadDeMedida: true }, orderBy: { nombre: 'asc' } }); }
  crearInsumo(dto: CreateInsumoDto) { return this.translateDatabaseError(() => this.prisma.insumo.create({ data: { ...dto, stockActual: dto.stockActual ?? 0, stockMinimo: dto.stockMinimo ?? 0, costoUnitario: dto.costoUnitario } })); }
  actualizarInsumo(id: number, dto: Partial<CreateInsumoDto>) {
    if (dto.costoUnitario !== undefined && (!Number.isFinite(dto.costoUnitario) || dto.costoUnitario <= 0)) {
      throw new BadRequestException('El costo unitario debe ser un número mayor que 0');
    }
    return this.translateDatabaseError(() => this.prisma.insumo.update({ where: { idInsumo: id }, data: dto }));
  }
  ajustarInsumo(id: number, cantidad: number) { return this.translateDatabaseError(() => this.prisma.insumo.update({ where: { idInsumo: id }, data: { stockActual: { increment: cantidad } } })); }

  clientes() { return this.prisma.cliente.findMany({ include: { provincia: true }, orderBy: { nombre: 'asc' } }); }
  provincias() { return this.prisma.provincia.findMany({ orderBy: { nombre: 'asc' } }); }
  ciudades() { return this.prisma.ciudad.findMany({ select: { idCiudad: true, nombre: true, idProvincia: true }, orderBy: { nombre: 'asc' } }); }

  private async assertNoDuplicateCliente(data: Pick<CreateClienteDto, 'nombre' | 'direccion' | 'correoElectronico' | 'numeroDeTelefono'>, excludeId?: number) {
    const existing = await this.prisma.cliente.findMany({
      where: excludeId ? { idCliente: { not: excludeId } } : {},
      select: { nombre: true, direccion: true, correoElectronico: true, numeroDeTelefono: true },
    });
    const email = normalizeText(data.correoElectronico);
    const phone = normalizePhone(data.numeroDeTelefono);
    const name = normalizeText(data.nombre);
    const address = normalizeText(data.direccion);
    const duplicate = existing.some(client =>
      normalizeText(client.correoElectronico) === email ||
      (phone.length > 0 && normalizePhone(client.numeroDeTelefono) === phone) ||
      (normalizeText(client.nombre) === name && normalizeText(client.direccion) === address),
    );
    if (duplicate) throw new ConflictException('Ya existe un cliente con el mismo correo, teléfono o nombre y dirección');
  }

  async crearCliente(dto: CreateClienteDto) {
    const data = {
      ...dto,
      nombre: dto.nombre.trim(),
      descripcion: dto.descripcion?.trim() || null,
      direccion: dto.direccion.trim(),
      correoElectronico: dto.correoElectronico.trim().toLowerCase(),
      numeroDeTelefono: dto.numeroDeTelefono.trim(),
    };
    await this.assertNoDuplicateCliente(data);
    return this.translateDatabaseError(() => this.prisma.cliente.create({ data }));
  }

  async actualizarCliente(id: number, dto: Partial<CreateClienteDto>) {
    const current = await this.prisma.cliente.findUnique({ where: { idCliente: id } });
    if (!current) throw new NotFoundException('Recurso inexistente');
    const data = {
      ...dto,
      nombre: dto.nombre?.trim() ?? current.nombre,
      descripcion: dto.descripcion === undefined ? current.descripcion : dto.descripcion.trim() || null,
      direccion: dto.direccion?.trim() ?? current.direccion,
      correoElectronico: dto.correoElectronico?.trim().toLowerCase() ?? current.correoElectronico,
      numeroDeTelefono: dto.numeroDeTelefono?.trim() ?? current.numeroDeTelefono,
    };
    await this.assertNoDuplicateCliente(data, id);
    return this.translateDatabaseError(() => this.prisma.cliente.update({ where: { idCliente: id }, data }));
  }
}