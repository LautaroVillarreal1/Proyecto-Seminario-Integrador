import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  /** Recibe el servicio que proporciona las operaciones de la aplicación. */
  constructor(private readonly appService: AppService) {}

  @Get()
  /** Expone el mensaje de bienvenida en la ruta raíz. */
  getHello(): string {
    return this.appService.getHello();
  }
}
