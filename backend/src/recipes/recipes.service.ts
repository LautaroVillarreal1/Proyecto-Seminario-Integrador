import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/infrastructure/prisma/prisma.service';
import { CreateRecipeDto } from './dto';

@Injectable()
export class RecipesService {
  /** Recibe el cliente Prisma para consultar y modificar recetas. */
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

  /** Lista recetas con sus ingredientes y productos asociados. */
  list() { return this.prisma.receta.findMany({ include: { detalles: { include: { insumo: { include: { unidadDeMedida: true } } } }, productos: true }, orderBy: { idReceta: 'desc' } }); }

  /** Crea una receta con sus detalles y opcionalmente la vincula a un producto. */
  async create(dto: CreateRecipeDto) {
    const details = dto.detalles ?? [];
    const recipe = await this.translateDatabaseError(() => this.prisma.receta.create({
      data: {
        descripcion: dto.descripcion,
        rendimiento: dto.rendimiento,
        unidadRendimiento: dto.unidadRendimiento,
        tiempoPrepMin: dto.tiempoPrepMin,
        instrucciones: dto.instrucciones ?? '',
        detalles: details.length ? { create: details.map(detail => ({ idInsumo: detail.idInsumo, cantidad: detail.cantidad })) } : undefined,
      },
      include: { detalles: true },
    }));

    if (dto.idProducto) {
      await this.translateDatabaseError(() => this.prisma.producto.update({
        where: { idProducto: dto.idProducto },
        data: { idreceta: recipe.idReceta },
      }));
    }

    return recipe;
  }

  /** Actualiza una receta existente y reemplaza sus ingredientes si se enviaron nuevos. */
  async update(id: number, dto: Partial<CreateRecipeDto>) {
    const recipe = await this.prisma.receta.findUnique({ where: { idReceta: id } });
    if (!recipe) throw new NotFoundException('Receta inexistente');

    const details = dto.detalles ?? undefined;
    const updated = await this.translateDatabaseError(() => this.prisma.receta.update({
      where: { idReceta: id },
      data: {
        descripcion: dto.descripcion ?? recipe.descripcion,
        rendimiento: dto.rendimiento ?? recipe.rendimiento,
        unidadRendimiento: dto.unidadRendimiento ?? recipe.unidadRendimiento,
        tiempoPrepMin: dto.tiempoPrepMin ?? recipe.tiempoPrepMin,
        instrucciones: dto.instrucciones ?? recipe.instrucciones,
        ...(details ? { detalles: { deleteMany: {}, create: details.map(detail => ({ idInsumo: detail.idInsumo, cantidad: detail.cantidad })) } } : {}),
      },
      include: { detalles: true },
    }));

    if (dto.idProducto) {
      await this.translateDatabaseError(() => this.prisma.producto.update({
        where: { idProducto: dto.idProducto },
        data: { idreceta: id },
      }));
    }

    return updated;
  }

  /** Calcula los lotes posibles según el ingrediente con menor disponibilidad relativa. */
  async capacity(id: number) {
    const recipe = await this.prisma.receta.findUnique({ where: { idReceta: id }, include: { detalles: { include: { insumo: true } } } });
    if (!recipe) throw new NotFoundException('Receta inexistente');
    const batches = recipe.detalles.length ? Math.min(...recipe.detalles.map(detail => Math.floor(detail.insumo.stockActual / detail.cantidad))) : 0;
    return { idReceta: id, lotesDisponibles: batches, unidadesPosibles: batches * recipe.rendimiento };
  }
}