import { Injectable, inject } from '@angular/core';
import { AuthService } from '../auth/auth';

export interface PartidaMayorMenor {
  user_id: string;
  cartas_acertadas: number;
  cartas_totales: number;
  resultado: 'ganó' | 'perdió';
  tiempo_segundos: number;
}

@Injectable({ providedIn: 'root' })
export class PartidaMayorMenorService {
  private authService = inject(AuthService);

  async guardarPartida(partida: PartidaMayorMenor): Promise<void> {
    const { error } = await this.authService.client
      .from('partidas_mayor_menor')
      .insert([partida]);
    if (error) throw error;
  }
}