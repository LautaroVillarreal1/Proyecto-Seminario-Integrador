import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/infrastructure/prisma/prisma.service';
import { CreateRecipeDto } from './dto';

@Injectable()
export class RecipesService {
  constructor(private readonly prisma: PrismaService) {}

  list() { return this.prisma.receta.findMany({ include: { detalles: { include: { insumo: { include: { unidadDeMedida: true } } } }, productos: true }, orderBy: { idReceta: 'desc' } }); }
  async create(dto: CreateRecipeDto) {
    if (!dto.detalles?.length) throw new BadRequestException('La receta debe tener insumos');
    return this.prisma.receta.create({ data: { descripcion: dto.descripcion, rendimiento: dto.rendimiento, unidadRendimiento: dto.unidadRendimiento, tiempoPrepMin: dto.tiempoPrepMin, instrucciones: dto.instrucciones, detalles: { create: dto.detalles.map(detail => ({ idInsumo: detail.idInsumo, cantidad: detail.cantidad })) } }, include: { detalles: true } });
  }
  async capacity(id: number) {
    const recipe = await this.prisma.receta.findUnique({ where: { idReceta: id }, include: { detalles: { include: { insumo: true } } } });
    if (!recipe) throw new BadRequestException('Receta inexistente');
    const batches = recipe.detalles.length ? Math.min(...recipe.detalles.map(detail => Math.floor(detail.insumo.stockActual / detail.cantidad))) : 0;
    return { idReceta: id, lotesDisponibles: batches, unidadesPosibles: batches * recipe.rendimiento };
  }
}