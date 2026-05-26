import { Injectable, inject } from '@angular/core';
import { AuthService } from '../auth/auth';

export interface PartidaPreguntados {
  user_id: string;
  respuestas_correctas: number;
  respuestas_totales: number;
  resultado: 'ganó' | 'perdió';
  tiempo_segundos: number;
}

@Injectable({ providedIn: 'root' })
export class PartidaPreguntadosService {
  private authService = inject(AuthService);

  async guardarPartida(partida: PartidaPreguntados): Promise<void> {
    const { error } = await this.authService.client
      .from('partidas_preguntados')
      .insert([partida]);
    if (error) throw error;
  }
}