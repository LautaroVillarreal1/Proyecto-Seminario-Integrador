import { Injectable } from '@nestjs/common';
import { Usuario } from '@prisma/client';
import { PrismaService } from '../../shared/infrastructure/prisma/prisma.service';
import { UserRepository } from '../domain/user.repository';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  /** Recibe el servicio Prisma para realizar operaciones sobre usuarios. */
  constructor(private readonly prisma: PrismaService) {}

  /** Busca un usuario por correo normalizado e incluye su rol. */
  findByEmail(email: string): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({
      where: { correoElectronico: email.toLowerCase() },
      include: { rol: true },
    });
  }

  /** Busca un usuario por ID e incluye su rol. */
  findById(id: number): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({
      where: { idUsuario: id },
      include: { rol: true },
    });
  }

  /** Lista usuarios ordenados por apellido y nombre sin incluir contraseñas. */
  findAll(): Promise<Array<Omit<Usuario, 'passwordHash'>>> {
    return this.prisma.usuario.findMany({
      omit: { passwordHash: true },
      orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
    });
  }

  /** Crea un usuario con correo normalizado y omite el hash de la respuesta. */
  create(data: {
    nombre: string;
    apellido: string;
    correoElectronico: string;
    passwordHash: string;
    idRol: number;
  }): Promise<Omit<Usuario, 'passwordHash'>> {
    return this.prisma.usuario.create({
      data: { ...data, correoElectronico: data.correoElectronico.toLowerCase() },
      omit: { passwordHash: true },
    });
  }
}