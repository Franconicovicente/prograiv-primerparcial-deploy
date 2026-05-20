import { Injectable, inject } from '@angular/core';
import { AuthService } from '../auth/auth';

export interface Partida {
  user_id: string;
  palabra: string;
  resultado: 'ganó' | 'perdió';
  letras_seleccionadas: number;
  tiempo_segundos: number;
  errores: number;
}

@Injectable({ providedIn: 'root' })
export class PartidaService {
  private authService = inject(AuthService);

  async guardarPartida(partida: Partida): Promise<void> {
    const { error } = await this.authService['supabase']
      .from('partidas')
      .insert([partida]);
    if (error) throw error;
  }
}