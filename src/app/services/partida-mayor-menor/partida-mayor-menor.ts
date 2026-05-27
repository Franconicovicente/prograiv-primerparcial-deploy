import { Injectable, inject } from '@angular/core';
import { AuthService } from '../auth/auth';
import { PartidaMayorMenor } from '../../models/partidas.model';

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