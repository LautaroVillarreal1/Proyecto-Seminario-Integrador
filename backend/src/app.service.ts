import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  /** Devuelve el mensaje de bienvenida de la aplicación. */
  getHello(): string {
    return 'Hello World!';
  }
}
