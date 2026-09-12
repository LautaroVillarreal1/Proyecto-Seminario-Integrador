import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './shared/infrastructure/prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { CatalogModule } from './catalog/catalog.module';
import { RecipesModule } from './recipes/recipes.module';
import { RemitosModule } from './remitos/remitos.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, AuthModule, UsersModule, CatalogModule, RecipesModule, RemitosModule, ReportsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
