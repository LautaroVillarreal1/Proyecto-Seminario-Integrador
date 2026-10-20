import { Usuario } from '@prisma/client';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserRepository {
  findByEmail(email: string): Promise<Usuario | null>;
  findById(id: number): Promise<Usuario | null>;
  findAll(): Promise<Array<Omit<Usuario, 'passwordHash'>>>;
  create(data: {
    nombre: string;
    apellido: string;
    correoElectronico: string;
    passwordHash: string;
    idRol: number;
  }): Promise<Omit<Usuario, 'passwordHash'>>;
}