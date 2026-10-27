import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/infrastructure/prisma/prisma.service';
import { CreateCategoriaDto, CreateClienteDto, CreateInsumoDto, CreateProductoDto, UpdateCategoriaDto } from './dto';

const normalizeText = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toLowerCase();
const normalizePhone = (value: string) => value.replace(/\D/g, '');
const CATEGORY_ALIASES: Record<string, string> = {
  yogur: 'yogures',
  mermelada: 'mermeladas',
  kefir: 'kéfires',
  'kéfir': 'kéfires',
  granola: 'granolas',
  postre: 'postres',
  'dulce solido': 'dulces sólidos',
  'dulce sólido': 'dulces sólidos',
  'dulce de leche': 'dulces de leche',
};
const normalizeCategoryName = (name: string) => {
  const normalized = name.trim().replace(/\s+/g, ' ').toLowerCase();
  return CATEGORY_ALIASES[normalized] ?? normalized;
};

@Injectable()
export class CatalogService {
  /** Recibe el cliente Prisma usado para acceder a los datos del catálogo. */
  constructor(private readonly prisma: PrismaService) {}

  /** Convierte errores comunes de Prisma en excepciones HTTP comprensibles. */
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

  /** Devuelve todos los productos ordenados por nombre con sus relaciones principales. */
  productos() { return this.prisma.producto.findMany({ include: { categoria: true, unidadDeMedida: true, receta: true }, orderBy: { nombre: 'asc' } }); }

  /** Busca un producto por ID e informa si no existe. */
  async producto(id: number) {
    const producto = await this.prisma.producto.findUnique({ where: { idProducto: id }, include: { categoria: true, unidadDeMedida: true, receta: true } });
    if (!producto) throw new NotFoundException('Producto inexistente');
    return producto;
  }

  /** Crea un producto aplicando valores predeterminados a sus campos opcionales. */
  crearProducto(dto: CreateProductoDto) { return this.translateDatabaseError(() => this.prisma.producto.create({ data: { ...dto, precioUnitario: dto.precioUnitario, idreceta: dto.idreceta ?? null, stockActual: dto.stockActual ?? 0, stockMinimo: dto.stockMinimo ?? 0, activo: dto.activo ?? true } })); }

  /** Actualiza un producto luego de validar que su precio no sea negativo. */
  actualizarProducto(id: number, dto: Partial<CreateProductoDto>) {
    if (dto.precioUnitario !== undefined && (!Number.isFinite(dto.precioUnitario) || dto.precioUnitario < 0)) {
      throw new BadRequestException('El precio de venta no puede ser negativo');
    }
    return this.translateDatabaseError(() => this.prisma.producto.update({ where: { idProducto: id }, data: dto }));
  }

  /** Devuelve las categorías ordenadas alfabéticamente. */
  categorias() { return this.prisma.categoria.findMany({ orderBy: { nombre: 'asc' } }); }

  /** Normaliza y crea una categoría, evitando nombres vacíos o duplicados. */
  async crearCategoria(dto: CreateCategoriaDto) {
    const nombre = normalizeCategoryName(dto.nombre);
    if (!nombre) throw new BadRequestException('El nombre de la categoría es obligatorio');
    const existing = await this.prisma.categoria.findUnique({ where: { nombre } });
    if (existing) throw new ConflictException('Ya existe una categoría con ese nombre');
    return this.translateDatabaseError(() => this.prisma.categoria.create({ data: { nombre } }));
  }

  /** Actualiza una categoría y comprueba que el nombre normalizado siga siendo único. */
  async actualizarCategoria(id: number, dto: UpdateCategoriaDto) {
    const current = await this.prisma.categoria.findUnique({ where: { idCategoria: id } });
    if (!current) throw new NotFoundException('Categoría inexistente');
    if (dto.nombre === undefined) return current;
    const nombre = normalizeCategoryName(dto.nombre);
    if (!nombre) throw new BadRequestException('El nombre de la categoría es obligatorio');
    const existing = await this.prisma.categoria.findUnique({ where: { nombre } });
    if (existing && existing.idCategoria !== id) throw new ConflictException('Ya existe una categoría con ese nombre');
    return this.translateDatabaseError(() => this.prisma.categoria.update({ where: { idCategoria: id }, data: { nombre } }));
  }

  /** Elimina una categoría solo si existe y no tiene productos asociados. */
  async eliminarCategoria(id: number) {
    const categoria = await this.prisma.categoria.findUnique({ where: { idCategoria: id } });
    if (!categoria) throw new NotFoundException('Categoría inexistente');
    const productos = await this.prisma.producto.count({ where: { idCategoria: id } });
    if (productos > 0) throw new ConflictException(`No se puede eliminar la categoría porque tiene ${productos} producto(s) asociado(s)`);
    try {
      await this.prisma.categoria.delete({ where: { idCategoria: id } });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2003') {
        throw new ConflictException('No se puede eliminar la categoría porque tiene productos asociados');
      }
      if ((error as { code?: string }).code === 'P2025') throw new NotFoundException('Categoría inexistente');
      throw error;
    }
  }

  /** Devuelve los insumos ordenados por nombre con sus unidades de medida. */
  insumos() { return this.prisma.insumo.findMany({ include: { unidadDeMedida: true }, orderBy: { nombre: 'asc' } }); }

  /** Crea un insumo con stock inicial predeterminado cuando no se especifica. */
  crearInsumo(dto: CreateInsumoDto) { return this.translateDatabaseError(() => this.prisma.insumo.create({ data: { ...dto, stockActual: dto.stockActual ?? 0, stockMinimo: dto.stockMinimo ?? 0, costoUnitario: dto.costoUnitario } })); }

  /** Actualiza un insumo y valida que su costo unitario sea mayor que cero. */
  actualizarInsumo(id: number, dto: Partial<CreateInsumoDto>) {
    if (dto.costoUnitario !== undefined && (!Number.isFinite(dto.costoUnitario) || dto.costoUnitario <= 0)) {
      throw new BadRequestException('El costo unitario debe ser un número mayor que 0');
    }
    return this.translateDatabaseError(() => this.prisma.insumo.update({ where: { idInsumo: id }, data: dto }));
  }

  /** Aplica un ajuste positivo o negativo al stock actual de un insumo. */
  ajustarInsumo(id: number, cantidad: number) { return this.translateDatabaseError(() => this.prisma.insumo.update({ where: { idInsumo: id }, data: { stockActual: { increment: cantidad } } })); }

  /** Lista clientes ordenados por nombre e incluye su provincia. */
  clientes() { return this.prisma.cliente.findMany({ include: { provincia: true }, orderBy: { nombre: 'asc' } }); }

  /** Devuelve las provincias ordenadas por nombre. */
  provincias() { return this.prisma.provincia.findMany({ orderBy: { nombre: 'asc' } }); }

  /** Devuelve los datos básicos de las ciudades ordenados por nombre. */
  ciudades() { return this.prisma.ciudad.findMany({ select: { idCiudad: true, nombre: true, idProvincia: true }, orderBy: { nombre: 'asc' } }); }

  /** Comprueba que correo, teléfono o combinación de nombre y dirección no estén repetidos. */
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

  /** Normaliza y registra un cliente después de validar duplicados. */
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

  /** Actualiza un cliente conservando los valores omitidos y evitando duplicados. */
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