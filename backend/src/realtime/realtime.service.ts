import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

export interface RemitoRealtimeEvent {
  type: 'remito.updated';
  remito: Record<string, unknown>;
}

@Injectable()
export class RealtimeService {
  private readonly remitoEvents = new Subject<RemitoRealtimeEvent>();

  /** Expone los eventos publicados como un observable de solo lectura. */
  events() {
    return this.remitoEvents.asObservable();
  }

  /** Emite un evento de actualización de remito a los clientes suscritos. */
  publishRemito(remito: Record<string, unknown>) {
    this.remitoEvents.next({ type: 'remito.updated', remito });
  }
}
