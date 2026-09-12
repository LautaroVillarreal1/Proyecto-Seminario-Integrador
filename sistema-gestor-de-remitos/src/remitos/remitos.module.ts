import { Module } from '@nestjs/common';
import { RemitosController } from './remitos.controller';
import { RemitosService } from './remitos.service';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({ imports: [RealtimeModule], controllers: [RemitosController], providers: [RemitosService] })
export class RemitosModule {}