import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CatalogService } from './catalog.service';
import { CreateClienteDto, CreateInsumoDto, CreateProductoDto } from './dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('productos') productos() { return this.catalog.productos(); }
  @Get('productos/:id') producto(@Param('id', ParseIntPipe) id: number) { return this.catalog.producto(id); }
  @Post('productos') @Roles(1, 2) crearProducto(@Body() dto: CreateProductoDto) { return this.catalog.crearProducto(dto); }
  @Patch('productos/:id') @Roles(1, 2) actualizarProducto(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateProductoDto>) { return this.catalog.actualizarProducto(id, dto); }

  @Get('insumos') insumos() { return this.catalog.insumos(); }
  @Post('insumos') @Roles(1, 2) crearInsumo(@Body() dto: CreateInsumoDto) { return this.catalog.crearInsumo(dto); }
  @Patch('insumos/:id') @Roles(1, 2) actualizarInsumo(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateInsumoDto>) { return this.catalog.actualizarInsumo(id, dto); }
  @Post('insumos/:id/ajustes') @Roles(1, 2) ajustarInsumo(@Param('id', ParseIntPipe) id: number, @Body('cantidad') cantidad: number) { return this.catalog.ajustarInsumo(id, cantidad); }

  @Get('clientes') clientes() { return this.catalog.clientes(); }
  @Post('clientes') @Roles(1, 2) crearCliente(@Body() dto: CreateClienteDto) { return this.catalog.crearCliente(dto); }
  @Patch('clientes/:id') @Roles(1, 2) actualizarCliente(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateClienteDto>) { return this.catalog.actualizarCliente(id, dto); }
}