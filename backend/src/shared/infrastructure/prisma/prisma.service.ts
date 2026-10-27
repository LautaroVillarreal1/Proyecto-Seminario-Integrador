import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  /** Abre la conexión con la base de datos al iniciar el módulo de la aplicación. */
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  /** Cierra la conexión con la base de datos al destruir el módulo de la aplicación. */
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}