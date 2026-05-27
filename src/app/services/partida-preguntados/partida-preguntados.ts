import { Injectable, inject } from '@angular/core';
import { AuthService } from '../auth/auth';
import { PartidaPreguntados } from '../../models/partidas.model';



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