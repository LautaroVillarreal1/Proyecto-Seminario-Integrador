import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../shared/infrastructure/prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { CreateRemitoDto, RemitoFilterDto, UpdateRemitoDto } from './dto';

type Faltante = { idProducto: number; nombre: string; cantidad: number };
type RemitoCompleto = Prisma.RemitoGetPayload<{
  include: {
    cliente: true;
    estado: true;
    usuario: true;
    detalles: { include: { producto: true } };
  };
}>;

@Injectable()
export class RemitosService {
  // Inyecta el acceso a la base de datos y el publicador de cambios en tiempo real.
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
  ) {}

  // Combina únicamente los filtros recibidos para que cada criterio pueda aplicarse por separado.
  list(filters: RemitoFilterDto, userId?: number) {
    const where: Prisma.RemitoWhereInput = {
      // Si se indicó un usuario, limita los resultados a los remitos que tiene asignados.
      ...(userId ? { idUsuario: userId } : {}),
      ...(filters.idCliente ? { idCliente: filters.idCliente } : {}),
      ...(filters.idEstado ? { idEstado: filters.idEstado } : {}),
      // Admite un extremo o ambos y compara las fechas de entrega de forma inclusiva.
      ...(filters.desde || filters.hasta
        ? {
            fechaEntrega: {
              ...(filters.desde ? { gte: new Date(filters.desde) } : {}),
              ...(filters.hasta ? { lte: new Date(filters.hasta) } : {}),
            },
          }
        : {}),
      // El rango de precio se aplica sobre el subtotal de al menos uno de los detalles.
      ...(filters.precioMin || filters.precioMax
        ? {
            detalles: {
              some: {
                subTotal: {
                  ...(filters.precioMin ? { gte: filters.precioMin } : {}),
                  ...(filters.precioMax ? { lte: filters.precioMax } : {}),
                },
              },
            },
          }
        : {}),
      // Busca por producto dentro de los detalles asociados al remito.
      ...(filters.idProducto
        ? { detalles: { some: { idProducto: filters.idProducto } } }
        : {}),
      // Permite localizar remitos por provincia del cliente o texto de su dirección.
      ...(filters.localidad || filters.provincia
        ? {
            cliente: {
              ...(filters.provincia
                ? {
                    provincia: {
                      nombre: {
                        contains: filters.provincia,
                        mode: 'insensitive',
                      },
                    },
                  }
                : {}),
              ...(filters.localidad
                ? {
                    direccion: {
                      contains: filters.localidad,
                      mode: 'insensitive',
                    },
                  }
                : {}),
            },
          }
        : {}),
    };
    return this.prisma.remito.findMany({
      where,
      // Incluye los datos relacionados necesarios para devolver un resultado completo.
      include: {
        cliente: { include: { provincia: true } },
        estado: true,
        usuario: true,
        detalles: { include: { producto: true } },
      },
      // Presenta primero las entregas más recientes.
      orderBy: { fechaEntrega: 'desc' },
    });
  }

  // Recupera el remito con sus relaciones y falla si el identificador no corresponde a uno existente.
  async find(id: number) {
    const remito = await this.prisma.remito.findUnique({
      where: { idRemito: id },
      include: {
        cliente: true,
        estado: true,
        usuario: true,
        detalles: { include: { producto: true } },
      },
    });
    // Evita que las operaciones posteriores trabajen con un remito inexistente.
    if (!remito) throw new NotFoundException('Remito inexistente');
    return remito;
  }

  // Valida el pedido y crea el remito en una transacción para mantener consistentes sus detalles y el stock.
  async create(
    dto: CreateRemitoDto,
    userId: number,
  ): Promise<RemitoCompleto & { faltantes: Faltante[] }> {
    // Rechaza remitos incompletos antes de iniciar operaciones de base de datos.
    if (!dto.idResponsableEntrega)
      throw new BadRequestException('Es necesario asignar viajante al remito');
    if (!dto.detalles?.length)
      throw new BadRequestException('El remito debe tener productos');
    const { remito: created, faltantes } = await this.prisma.$transaction(
      async (tx) => {
        const products = await Promise.all(
          // Obtiene todos los productos para validar su estado y calcular los subtotales.
          dto.detalles.map((detail) =>
            tx.producto.findUnique({
              where: { idProducto: detail.idProducto },
            }),
          ),
        );
        // No permite referencias inexistentes ni productos que ya no están disponibles para la venta.
        if (products.some((product) => !product))
          throw new NotFoundException('Producto inexistente');
        if (products.some((product) => !product!.activo))
          throw new ConflictException(
            'No se pueden incluir productos inactivos',
          );
        const requestedByProduct = new Map<number, number>();
        // Acumula líneas repetidas para comparar el stock con la cantidad total solicitada.
        for (const detail of dto.detalles)
          requestedByProduct.set(
            detail.idProducto,
            (requestedByProduct.get(detail.idProducto) ?? 0) + detail.cantidad,
          );
        // Conserva los productos recuperados para informar el nombre de cada artículo faltante.
        const productById = new Map(
          products.map((product) => [product!.idProducto, product!]),
        );
        const faltantes = Array.from(
          requestedByProduct,
          ([productId, quantity]) => {
            const product = productById.get(productId)!;
            const missing = quantity - product.stockActual;
            return missing > 0
              ? {
                  idProducto: productId,
                  nombre: product.nombre,
                  cantidad: missing,
                }
              : null;
          },
        ).filter((shortage): shortage is Faltante => shortage !== null);
        // Exige confirmación explícita antes de crear un remito que no pueda prepararse por falta de stock.
        if (faltantes.length > 0 && !dto.confirmarFaltantes) {
          throw new ConflictException({
            message:
              'Hay productos con stock insuficiente. Confirmá la creación para continuar.',
            faltantes,
          });
        }
        // Calcula el subtotal con precios vigentes en la base, no con valores enviados por el cliente.
        const subtotal = dto.detalles.reduce(
          (sum, detail, index) =>
            sum + Number(products[index]!.precioUnitario) * detail.cantidad,
          0,
        );
        const descuento = dto.descuento ?? 0;
        // Impide que el descuento supere el importe de los productos.
        if (descuento > subtotal)
          throw new BadRequestException(
            'El descuento no puede superar el subtotal del remito',
          );
        // Deja constancia en la observación para que los faltantes puedan revisarse al reponer stock.
        const observacion =
          faltantes.length > 0
            ? [
                `Falta:\n${faltantes.map((shortage) => `${shortage.cantidad} ${shortage.nombre}`).join('\n')}`,
                dto.observacion?.trim(),
              ]
                .filter(Boolean)
                .join('\n')
            : dto.observacion;
        // Persiste cabecera y detalles juntos; el estado especial identifica los remitos con faltantes.
        const remito = await tx.remito.create({
          data: {
            fechaEntrega: new Date(dto.fechaEntrega),
            horaEntrega: new Date(dto.horaEntrega),
            idUsuario: dto.idResponsableEntrega ?? userId,
            idEstado: faltantes.length > 0 ? 4 : dto.idEstado,
            idCliente: dto.idCliente,
            observacion,
            descuento,
            detalles: {
              create: dto.detalles.map((detail, index) => ({
                idProducto: detail.idProducto,
                cantidad: detail.cantidad,
                subTotal:
                  Number(products[index]!.precioUnitario) * detail.cantidad,
              })),
            },
          },
          include: { detalles: true },
        });
        // Solo descuenta existencias cuando hay stock suficiente para todos los productos.
        if (faltantes.length === 0) {
          await Promise.all(
            dto.detalles.map((detail) =>
              tx.producto.update({
                where: { idProducto: detail.idProducto },
                data: { stockActual: { decrement: detail.cantidad } },
              }),
            ),
          );
        }
        return { remito, faltantes };
      },
    );
    // Recarga las relaciones para devolver y publicar el formato completo del remito.
    const complete = await this.find(created.idRemito);
    this.realtime.publishRemito(complete);
    return { ...complete, faltantes };
  }

  // Actualiza el remito y, al confirmar faltantes, valida y descuenta el stock en una transacción.
  async update(
    id: number,
    dto: UpdateRemitoDto,
    userId: number,
    roleId: number,
  ) {
    const current = await this.find(id);
    // Un viajante solo puede modificar los remitos que tiene asignados.
    if (roleId === 3 && current.idUsuario !== userId)
      throw new ForbiddenException('El remito no esta asignado al viajante');
    // Convierte la fecha opcional al tipo esperado por Prisma y deja intactos los campos omitidos.
    const data = {
      ...dto,
      fechaEntregaReal: dto.fechaEntregaReal
        ? new Date(dto.fechaEntregaReal)
        : undefined,
    };
    // Detecta la transición de pendiente por falta de stock a confirmado.
    const isStockShortageConfirmation =
      current.idEstado === 4 &&
      dto.idEstado === 8 &&
      current.observacion?.startsWith('Falta:\n');
    // La confirmación de faltantes modifica inventario y queda reservada para administradores.
    if (isStockShortageConfirmation && roleId === 3)
      throw new ForbiddenException(
        'Solo un administrador puede confirmar un remito pendiente por falta de stock',
      );
    const updated = isStockShortageConfirmation
      ? await this.prisma.$transaction(async (tx) => {
          // Recupera los detalles con sus productos para validar la disponibilidad actual.
          const details = await tx.detalleRemito.findMany({
            where: { idRemito: id },
            include: { producto: true },
          });
          // Consolida líneas repetidas para comprobar y descontar una cantidad total por producto.
          const requestedByProduct = new Map<
            number,
            { quantity: number; product: (typeof details)[number]['producto'] }
          >();
          for (const detail of details) {
            const requested = requestedByProduct.get(detail.idProducto);
            requestedByProduct.set(detail.idProducto, {
              quantity: (requested?.quantity ?? 0) + detail.cantidad,
              product: detail.producto,
            });
          }
          // Si un producto no alcanza, aborta la transacción antes de modificar existencias.
          for (const { quantity, product } of requestedByProduct.values()) {
            if (product.stockActual < quantity)
              throw new ConflictException(
                `Stock insuficiente para ${product.nombre}`,
              );
          }
          // Descuenta todas las cantidades y actualiza el remito en la misma transacción.
          await Promise.all(
            Array.from(requestedByProduct, ([idProducto, { quantity }]) =>
              tx.producto.update({
                where: { idProducto },
                data: { stockActual: { decrement: quantity } },
              }),
            ),
          );
          return tx.remito.update({
            where: { idRemito: id },
            data,
            include: {
              cliente: { include: { provincia: true } },
              estado: true,
              usuario: true,
              detalles: { include: { producto: true } },
            },
          });
        })
      : await this.prisma.remito.update({
          where: { idRemito: id },
          data,
          include: {
            cliente: { include: { provincia: true } },
            estado: true,
            usuario: true,
            detalles: { include: { producto: true } },
          },
        });
    // Notifica a los clientes conectados tanto en cambios comunes como al confirmar el stock.
    this.realtime.publishRemito(updated);
    return updated;
  }
}
