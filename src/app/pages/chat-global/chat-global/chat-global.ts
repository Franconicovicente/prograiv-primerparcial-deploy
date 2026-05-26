import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef, AfterViewChecked, NgZone, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth/auth';
import { ChatService, Mensaje } from '../../../services/chat-global/chat-global';

@Component({
  selector: 'app-chat-global',
  standalone: true,
  imports: [DatePipe, FormsModule],
  templateUrl: './chat-global.html',
  styleUrls: ['./chat-global.css']
})
export class ChatGlobalComponent implements OnInit, OnDestroy, AfterViewChecked {
  // ── Inyecciones ──────────────────────────────────────────
  private authService = inject(AuthService);
  private chatService = inject(ChatService);
  private ngZone = inject(NgZone);

  // ── Referencias Elementos ────────────────────────────────
  @ViewChild('messagesEnd') messagesEnd!: ElementRef;

  // ── Signals de Datos ─────────────────────────────────────
  mensajes = signal<Mensaje[]>([]);
  nuevoMensaje = signal<string>('');

  // ── Signals de Estado ────────────────────────────────────
  enviando = signal<boolean>(false);
  cargando = signal<boolean>(true);
  error = signal<string | null>(null);
  userId = signal<string>('');

  // ── Propiedades Privadas e Inmutables ────────────────────
  private nombreUsuario: string = '';
  private canal: any;
  private shouldScroll: boolean = false;

  // ── Ciclo de Vida ────────────────────────────────────────
  async ngOnInit(): Promise<void> {
    const id = await this.authService.getUserId();
    this.userId.set(id ?? '');

    this.authService.session$.subscribe(usuario => {
      if (usuario) this.nombreUsuario = usuario.nombre;
    });

    const idSupabase = await this.authService.getUserId();
    this.userId.set(idSupabase ?? '');

    await this.cargarMensajes();
    this.suscribirRealtime();
  }

  ngOnDestroy(): void {
    if (this.canal) {
      this.authService.client.removeChannel(this.canal);
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollAbajo();
      this.shouldScroll = false;
    }
  }

  // ── Lógica de Datos y Realtime ───────────────────────────
  private async cargarMensajes(): Promise<void> {
    try {
      const datos = await this.chatService.getMensajes();
      this.mensajes.set(datos);
      this.shouldScroll = true;
    } catch (err) {
      this.error.set('No se pudieron cargar los mensajes.');
    } finally {
      this.cargando.set(false);
    }
  }

  private suscribirRealtime(): void {
    this.canal = this.chatService.suscribirMensajes((mensaje) => {
      this.ngZone.run(() => {
        const existe = this.mensajes().some(m => m.id === mensaje.id);
        if (!existe) {
          this.mensajes.update(lista => [...lista, mensaje]);
          this.shouldScroll = true;
        }
      });
    });
  }

  // ── Acciones de Usuario ──────────────────────────────────
  async enviar(): Promise<void> {
    const texto = this.nuevoMensaje().trim();
    const idActual = this.userId();
    if (!texto || this.enviando() || !idActual) return;

    this.enviando.set(true);
    this.nuevoMensaje.set('');

    try {
      await this.chatService.enviarMensaje(idActual, this.nombreUsuario, texto);
    } catch (err) {
      console.error('Error al enviar:', err);
      this.nuevoMensaje.set(texto);
    } finally {
      this.enviando.set(false);
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.enviar();
    }
  }

  // ── Helpers de UI y Scroll ───────────────────────────────
  private scrollAbajo(): void {
    try {
      this.messagesEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
    } catch {}
  }

  esMio(mensaje: Mensaje): boolean {
    return mensaje.user_id === this.userId();
  }
}