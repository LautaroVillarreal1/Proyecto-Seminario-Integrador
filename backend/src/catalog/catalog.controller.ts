import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseFloatPipe, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CatalogService } from './catalog.service';
import { CreateCategoriaDto, CreateClienteDto, CreateInsumoDto, CreateProductoDto, UpdateCategoriaDto } from './dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class CatalogController {
  /** Recibe el servicio que implementa las operaciones del catálogo. */
  constructor(private readonly catalog: CatalogService) {}

  @Get('productos')
  /** Lista productos con su categoría, unidad de medida y receta asociadas. */
  productos() { return this.catalog.productos(); }

  @Get('productos/:id')
  /** Obtiene el detalle de un producto identificado por su ID. */
  producto(@Param('id', ParseIntPipe) id: number) { return this.catalog.producto(id); }

  @Post('productos')
  @Roles(1, 2)
  /** Crea un producto a partir de los datos recibidos. */
  crearProducto(@Body() dto: CreateProductoDto) { return this.catalog.crearProducto(dto); }

  @Patch('productos/:id')
  @Roles(1, 2)
  /** Actualiza los campos enviados para el producto indicado. */
  actualizarProducto(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateProductoDto>) { return this.catalog.actualizarProducto(id, dto); }

  @Get('categorias')
  /** Lista las categorías disponibles. */
  categorias() { return this.catalog.categorias(); }

  @Post('categorias')
  @Roles(1)
  /** Crea una categoría y normaliza su nombre. */
  crearCategoria(@Body() dto: CreateCategoriaDto) { return this.catalog.crearCategoria(dto); }

  @Patch('categorias/:id')
  @Roles(1)
  /** Actualiza el nombre de la categoría indicada. */
  actualizarCategoria(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCategoriaDto) { return this.catalog.actualizarCategoria(id, dto); }

  @Delete('categorias/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(1)
  /** Elimina una categoría cuando no tiene productos asociados. */
  eliminarCategoria(@Param('id', ParseIntPipe) id: number) { return this.catalog.eliminarCategoria(id); }

  @Get('insumos')
  /** Lista los insumos junto con sus unidades de medida. */
  insumos() { return this.catalog.insumos(); }

  @Post('insumos')
  @Roles(1, 2)
  /** Registra un insumo con sus valores iniciales de stock y costo. */
  crearInsumo(@Body() dto: CreateInsumoDto) { return this.catalog.crearInsumo(dto); }

  @Patch('insumos/:id')
  @Roles(1, 2)
  /** Actualiza los datos del insumo indicado. */
  actualizarInsumo(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateInsumoDto>) { return this.catalog.actualizarInsumo(id, dto); }

  @Post('insumos/:id/ajustes')
  @HttpCode(HttpStatus.OK)
  @Roles(1, 2)
  /** Incrementa o reduce el stock del insumo según la cantidad recibida. */
  ajustarInsumo(@Param('id', ParseIntPipe) id: number, @Body('cantidad', ParseFloatPipe) cantidad: number) { return this.catalog.ajustarInsumo(id, cantidad); }

  @Get('clientes')
  /** Lista los clientes junto con la provincia correspondiente. */
  clientes() { return this.catalog.clientes(); }

  @Post('clientes')
  @Roles(1, 2)
  /** Registra un cliente nuevo. */
  crearCliente(@Body() dto: CreateClienteDto) { return this.catalog.crearCliente(dto); }

  @Patch('clientes/:id')
  @Roles(1, 2)
  /** Actualiza los datos del cliente indicado. */
  actualizarCliente(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateClienteDto>) { return this.catalog.actualizarCliente(id, dto); }

  @Get('provincias')
  /** Lista las provincias disponibles para asociar a clientes. */
  provincias() { return this.catalog.provincias(); }

  @Get('ciudades')
  /** Lista las ciudades y sus provincias para selección en formularios. */
  ciudades() { return this.catalog.ciudades(); }
}