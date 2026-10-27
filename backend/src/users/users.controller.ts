import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(1)
export class UsersController {
  /** Recibe el servicio de usuarios que ejecuta las operaciones solicitadas. */
  constructor(private readonly users: UsersService) {}

  @Get()
  /** Devuelve la lista de usuarios habilitada para administración. */
  list() {
    return this.users.list();
  }

  @Post()
  /** Registra un usuario con los datos validados de la solicitud. */
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }
}