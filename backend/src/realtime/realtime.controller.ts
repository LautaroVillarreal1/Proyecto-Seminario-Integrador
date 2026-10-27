import { Controller, Sse } from '@nestjs/common';
import { map } from 'rxjs/operators';
import { RealtimeService } from './realtime.service';

@Controller('realtime')
export class RealtimeController {
  /** Recibe el publicador de eventos de cambios en remitos. */
  constructor(private readonly realtime: RealtimeService) {}

  @Sse('remitos')
  /** Abre un flujo SSE que transmite los eventos de actualización de remitos. */
  remitos() {
    return this.realtime.events().pipe(map(event => ({ data: event })));
  }
}
