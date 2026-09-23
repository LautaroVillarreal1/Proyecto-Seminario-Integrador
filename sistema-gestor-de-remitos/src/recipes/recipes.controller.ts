import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateRecipeDto } from './dto';
import { RecipesService } from './recipes.service';

@Controller('recetas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RecipesController {
  constructor(private readonly recipes: RecipesService) {}
  @Get() list() { return this.recipes.list(); }
  @Post() @Roles(1, 2) create(@Body() dto: CreateRecipeDto) { return this.recipes.create(dto); }
  @Patch(':id') @Roles(1, 2) update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateRecipeDto>) { return this.recipes.update(id, dto); }
  @Get(':id/capacidad') capacity(@Param('id', ParseIntPipe) id: number) { return this.recipes.capacity(id); }
}