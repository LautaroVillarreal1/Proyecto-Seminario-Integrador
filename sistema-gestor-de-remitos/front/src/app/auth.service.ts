import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface Session { accessToken: string; user: { nombre: string; apellido: string; correoElectronico: string; idRol: number }; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly key = 'frulatti.session';
  readonly session = (): Session | null => { const raw = localStorage.getItem(this.key); return raw ? JSON.parse(raw) as Session : null; };
  login(correoElectronico: string, password: string): Observable<Session> {
    return this.http.post<Session>('/api/auth/login', { correoElectronico, password }).pipe(tap(session => localStorage.setItem(this.key, JSON.stringify(session))));
  }
  logout(): void { localStorage.removeItem(this.key); }
  token(): string | null { return this.session()?.accessToken ?? null; }
}