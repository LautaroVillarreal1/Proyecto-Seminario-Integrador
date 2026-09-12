import { Injectable } from '@nestjs/common';
import { Usuario } from '@prisma/client';
import { PrismaService } from '../../shared/infrastructure/prisma/prisma.service';
import { UserRepository } from '../domain/user.repository';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({
      where: { correoElectronico: email.toLowerCase() },
      include: { rol: true },
    });
  }

  findById(id: number): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({
      where: { idUsuario: id },
      include: { rol: true },
    });
  }

  findAll(): Promise<Array<Omit<Usuario, 'passwordHash'>>> {
    return this.prisma.usuario.findMany({
      omit: { passwordHash: true },
      orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
    });
  }

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