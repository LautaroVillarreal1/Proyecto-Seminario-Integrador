import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

export interface RemitoRealtimeEvent {
  type: 'remito.updated';
  remito: Record<string, unknown>;
}

@Injectable()
export class RealtimeService {
  private readonly remitoEvents = new Subject<RemitoRealtimeEvent>();

  events() {
    return this.remitoEvents.asObservable();
  }

  publishRemito(remito: Record<string, unknown>) {
    this.remitoEvents.next({ type: 'remito.updated', remito });
  }
}
