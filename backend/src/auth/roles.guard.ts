import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  /** Recibe el lector de metadatos de roles definidos en rutas y controladores. */
  constructor(private readonly reflector: Reflector) {}

  /** Permite el acceso si la ruta no exige roles o el usuario posee uno autorizado. */
  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<number[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (!roles?.length) return true;
    const user = context.switchToHttp().getRequest<{ user?: { idRol?: number } }>().user;
    if (!user || !roles.includes(user.idRol ?? -1)) throw new ForbiddenException();
    return true;
  }
}