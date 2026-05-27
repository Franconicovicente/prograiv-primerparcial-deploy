import { Injectable, inject } from '@angular/core';
import { AuthService } from '../auth/auth';
import { Encuesta, EncuestaResultado } from '../../models/encuesta.model';

@Injectable({ providedIn: 'root' })
export class EncuestaService {
  private authService = inject(AuthService);

  async guardarEncuesta(encuesta: Encuesta): Promise<void> {
    const { error } = await this.authService.client
      .from('encuestas')
      .insert([encuesta]);
    if (error) throw error;
  }

  async getResultados(): Promise<EncuestaResultado[]> {
    const { data, error } = await this.authService.client
      .from('encuestas')
      .select('*, usuarios(nombre, apellido, email)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as EncuestaResultado[];
  }

  async yaRespondio(userId: string): Promise<boolean> {
    const { data } = await this.authService.client
      .from('encuestas')
      .select('id')
      .eq('user_id', userId)
      .limit(1);
    return (data?.length ?? 0) > 0;
  }
}