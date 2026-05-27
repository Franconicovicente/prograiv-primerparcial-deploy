import { Injectable, inject } from '@angular/core';
import { AuthService } from '../auth/auth';
import { Partida } from '../../models/partidas.model';


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