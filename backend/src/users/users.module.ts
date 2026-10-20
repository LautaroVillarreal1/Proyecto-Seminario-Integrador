import { Module } from '@nestjs/common';
import { USER_REPOSITORY } from './domain/user.repository';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, PrismaUserRepository, { provide: USER_REPOSITORY, useExisting: PrismaUserRepository }],
  exports: [UsersService, PrismaUserRepository, USER_REPOSITORY],
})
export class UsersModule {}