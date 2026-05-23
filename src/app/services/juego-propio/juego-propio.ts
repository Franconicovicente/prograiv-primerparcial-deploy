import { Injectable, inject } from '@angular/core';
import { AuthService } from '../auth/auth';

export interface PartidaJuegoPropio {
  user_id: string;
  puntuacion: number;
  lineas_completadas: number;
  nivel_alcanzado: number;
}

@Injectable({ providedIn: 'root' })
export class PartidaJuegoPropioService {
  private authService = inject(AuthService);

  async guardarPartida(partida: PartidaJuegoPropio): Promise<void> {
    const { error } = await this.authService.client
      .from('partidas_tetris')
      .insert([partida]);
    if (error) throw error;
  }
}