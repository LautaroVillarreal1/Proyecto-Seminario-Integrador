import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { StringValue } from 'ms';
import { USER_REPOSITORY } from '../users/domain/user.repository';
import { PrismaUserRepository } from '../users/infrastructure/prisma-user.repository';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [ConfigModule, PassportModule, JwtModule.registerAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({
      secret: config.getOrThrow<string>('JWT_SECRET'),
      signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '8h') as StringValue },
    }),
  })],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RolesGuard, PrismaUserRepository, { provide: USER_REPOSITORY, useExisting: PrismaUserRepository }],
  exports: [AuthService, JwtModule, PassportModule, RolesGuard],
})
export class AuthModule {}