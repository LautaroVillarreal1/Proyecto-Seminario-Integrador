import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/infrastructure/prisma/prisma.service';
import { CreateRecipeDto } from './dto';

@Injectable()
export class RecipesService {
  constructor(private readonly prisma: PrismaService) {}

  list() { return this.prisma.receta.findMany({ include: { detalles: { include: { insumo: { include: { unidadDeMedida: true } } } }, productos: true }, orderBy: { idReceta: 'desc' } }); }

  async create(dto: CreateRecipeDto) {
    const details = dto.detalles ?? [];
    const recipe = await this.prisma.receta.create({
      data: {
        descripcion: dto.descripcion,
        rendimiento: dto.rendimiento,
        unidadRendimiento: dto.unidadRendimiento,
        tiempoPrepMin: dto.tiempoPrepMin,
        instrucciones: dto.instrucciones ?? '',
        detalles: details.length ? { create: details.map(detail => ({ idInsumo: detail.idInsumo, cantidad: detail.cantidad })) } : undefined,
      },
      include: { detalles: true },
    });

    if (dto.idProducto) {
      await this.prisma.producto.update({
        where: { idProducto: dto.idProducto },
        data: { idreceta: recipe.idReceta },
      });
    }

    return recipe;
  }

  async update(id: number, dto: Partial<CreateRecipeDto>) {
    const recipe = await this.prisma.receta.findUnique({ where: { idReceta: id } });
    if (!recipe) throw new BadRequestException('Receta inexistente');

    const details = dto.detalles ?? undefined;
    const updated = await this.prisma.receta.update({
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
    });

    if (dto.idProducto) {
      await this.prisma.producto.update({
        where: { idProducto: dto.idProducto },
        data: { idreceta: id },
      });
    }

    return updated;
  }

  async capacity(id: number) {
    const recipe = await this.prisma.receta.findUnique({ where: { idReceta: id }, include: { detalles: { include: { insumo: true } } } });
    if (!recipe) throw new BadRequestException('Receta inexistente');
    const batches = recipe.detalles.length ? Math.min(...recipe.detalles.map(detail => Math.floor(detail.insumo.stockActual / detail.cantidad))) : 0;
    return { idReceta: id, lotesDisponibles: batches, unidadesPosibles: batches * recipe.rendimiento };
  }
}