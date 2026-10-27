import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateRecipeDto } from './dto';
import { RecipesService } from './recipes.service';

@Controller('recetas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RecipesController {
  /** Recibe el servicio que gestiona las recetas de producción. */
  constructor(private readonly recipes: RecipesService) {}

  /** Lista las recetas con los ingredientes y productos relacionados. */
  @Get() list() { return this.recipes.list(); }

  /** Crea una receta y la vincula al producto indicado cuando se proporciona. */
  @Post()
  @Roles(1, 2)
  create(@Body() dto: CreateRecipeDto) { return this.recipes.create(dto); }

  /** Actualiza los datos y, si fueron enviados, los ingredientes de una receta. */
  @Patch(':id')
  @Roles(1, 2)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateRecipeDto>) { return this.recipes.update(id, dto); }

  /** Calcula la cantidad de lotes y unidades producibles según el stock de ingredientes. */
  @Get(':id/capacidad')
  capacity(@Param('id', ParseIntPipe) id: number) { return this.recipes.capacity(id); }
}