import { Controller, Sse } from '@nestjs/common';
import { map } from 'rxjs/operators';
import { RealtimeService } from './realtime.service';

@Controller('realtime')
export class RealtimeController {
  constructor(private readonly realtime: RealtimeService) {}

  @Sse('remitos')
  remitos() {
    return this.realtime.events().pipe(map(event => ({ data: event })));
  }
}
