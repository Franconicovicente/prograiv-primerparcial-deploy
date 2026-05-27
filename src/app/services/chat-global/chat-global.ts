import { Injectable, inject } from '@angular/core';
import { AuthService } from '../auth/auth';
import { Mensaje } from '../../models/chat-model';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private authService = inject(AuthService);

  async getMensajes(): Promise<Mensaje[]> {
    const { data, error } = await this.authService.client
      .from('mensajes')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) throw error;
    return data as Mensaje[];
  }

  async enviarMensaje(userId: string, nombreUsuario: string, contenido: string): Promise<void> {
    const { error } = await this.authService.client
      .from('mensajes')
      .insert([{ user_id: userId, nombre_usuario: nombreUsuario, contenido }]);
    if (error) throw error;
  }

  suscribirMensajes(callback: (mensaje: Mensaje) => void) {
    return this.authService.client
      .channel('mensajes-global')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mensajes' },
        (payload) => callback(payload.new as Mensaje)
      )
      .subscribe();
  }
}