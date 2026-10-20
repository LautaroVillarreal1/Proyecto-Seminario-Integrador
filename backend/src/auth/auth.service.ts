import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { USER_REPOSITORY } from '../users/domain/user.repository';
import type { UserRepository } from '../users/domain/user.repository';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.correoElectronico);
    if (!user || !user.activo || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const payload = { sub: user.idUsuario, email: user.correoElectronico, roleId: user.idRol };
    return { accessToken: await this.jwt.signAsync(payload), user: this.publicUser(user) };
  }

  private publicUser(user: { passwordHash: string; [key: string]: unknown }) {
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return safeUser;
  }
}