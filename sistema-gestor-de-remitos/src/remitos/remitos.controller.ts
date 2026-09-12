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
  constructor(private readonly remitos: RemitosService) {}

  @Get()
  list(@Query() filters: RemitoFilterDto, @Req() request: AuthenticatedRequest) { return this.remitos.list(filters, request.user.idRol === 3 ? request.user.idUsuario : undefined); }

  @Get(':id') find(@Param('id', ParseIntPipe) id: number) { return this.remitos.find(id); }

  @Post() @Roles(1, 2) create(@Body() dto: CreateRemitoDto, @Req() request: AuthenticatedRequest) { return this.remitos.create(dto, request.user.idUsuario); }

  @Patch(':id') update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRemitoDto, @Req() request: AuthenticatedRequest) { return this.remitos.update(id, dto, request.user.idUsuario, request.user.idRol); }
}