import { ConflictException, Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { USER_REPOSITORY } from './domain/user.repository';
import type { UserRepository } from './domain/user.repository';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  /** Recibe el repositorio que persiste y consulta usuarios. */
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  /** Obtiene todos los usuarios sin exponer sus hashes de contraseña. */
  list() {
    return this.users.findAll();
  }

  /** Verifica que el correo no exista, cifra la contraseña y crea el usuario. */
  async create(dto: CreateUserDto) {
    if (await this.users.findByEmail(dto.correoElectronico)) {
      throw new ConflictException('El correo ya esta registrado');
    }
    return this.users.create({
      nombre: dto.nombre,
      apellido: dto.apellido,
      correoElectronico: dto.correoElectronico,
      idRol: dto.idRol,
      passwordHash: await bcrypt.hash(dto.password, 12),
    });
  }
}