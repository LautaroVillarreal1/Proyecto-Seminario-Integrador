import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateRemitoDto, RemitoFilterDto, UpdateRemitoDto } from './dto';
import { RemitosService } from './remitos.service';

type AuthenticatedRequest = Request & { user: { idUsuario: number; idRol: number } };

@Controller('remitos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RemitosController {
  /** Recibe el servicio encargado de consultar y gestionar remitos. */
  constructor(private readonly remitos: RemitosService) {}

  @Get()
  /** Lista remitos aplicando filtros y limita la consulta al viajante autenticado cuando corresponde. */
  list(@Query() filters: RemitoFilterDto, @Req() request: AuthenticatedRequest) { return this.remitos.list(filters, request.user.idRol === 3 ? request.user.idUsuario : undefined); }

  @Get(':id')
  /** Obtiene un remito por su identificador. */
  find(@Param('id', ParseIntPipe) id: number) { return this.remitos.find(id); }

  @Post()
  @Roles(1, 2)
  /** Crea un remito asociado al usuario responsable que realiza la solicitud. */
  create(@Body() dto: CreateRemitoDto, @Req() request: AuthenticatedRequest) { return this.remitos.create(dto, request.user.idUsuario); }

  @Patch(':id')
  /** Actualiza el estado y los datos permitidos del remito según el usuario y su rol. */
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRemitoDto, @Req() request: AuthenticatedRequest) { return this.remitos.update(id, dto, request.user.idUsuario, request.user.idRol); }
}