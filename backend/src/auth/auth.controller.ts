import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  /** Recibe el servicio encargado de autenticar usuarios. */
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  /** Valida las credenciales y devuelve el resultado del inicio de sesión. */
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }
}