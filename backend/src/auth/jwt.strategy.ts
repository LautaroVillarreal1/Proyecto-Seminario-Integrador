import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaUserRepository } from '../users/infrastructure/prisma-user.repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /** Configura la validación JWT e inyecta el repositorio de usuarios. */
  constructor(config: ConfigService, private readonly users: PrismaUserRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /** Busca al usuario del token y rechaza sesiones de usuarios inexistentes o inactivos. */
  async validate(payload: { sub: number }) {
    const user = await this.users.findById(payload.sub);
    if (!user || !user.activo) throw new UnauthorizedException();
    return user;
  }
}