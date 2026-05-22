import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef, AfterViewChecked, ChangeDetectorRef, NgZone } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth/auth';
import { ChatService, Mensaje } from '../../../services/chat-global/chat-global';

@Component({
  selector: 'app-chat-global',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, FormsModule],
  templateUrl: './chat-global.html',
  styleUrls: ['./chat-global.css']
})
export class ChatGlobalComponent implements OnInit, OnDestroy, AfterViewChecked {
  private authService = inject(AuthService);
  private chatService = inject(ChatService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone)

  @ViewChild('messagesEnd') messagesEnd!: ElementRef;

  mensajes: Mensaje[] = [];
  nuevoMensaje: string = '';
  enviando: boolean = false;
  cargando: boolean = true;
  error: string | null = null;

  userId: string = '';
  private nombreUsuario: string = '';
  private canal: any;
  private shouldScroll: boolean = false;

  async ngOnInit(): Promise<void> {
    const id = await this.authService.getUserId();
  console.log('getUserId devolvió:', id);
  this.userId = id ?? '';
    this.authService.session$.subscribe(usuario => {
    if (usuario) this.nombreUsuario = usuario.nombre;
  });

  // Después el userId directo desde Supabase
  this.userId = (await this.authService.getUserId()) ?? '';
  this.cdr.detectChanges()

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

  private async cargarMensajes(): Promise<void> {
    try {
      this.mensajes = await this.chatService.getMensajes();
      this.shouldScroll = true;
    } catch (err) {
      this.error = 'No se pudieron cargar los mensajes.';
    } finally {
      this.cargando = false;
      this.cdr.detectChanges()
    }
  }

  private suscribirRealtime(): void {
    this.canal = this.chatService.suscribirMensajes((mensaje) => {
    this.ngZone.run(() => {
      const existe = this.mensajes.some(m => m.id === mensaje.id);
      if (!existe) {
        this.mensajes.push(mensaje);
        this.shouldScroll = true;
        this.cdr.detectChanges();
      }
    });
  });
  }

  async enviar(): Promise<void> {
    console.log('userId:', this.userId);
  console.log('nombreUsuario:', this.nombreUsuario);
  console.log('mensaje:', this.nuevoMensaje);
    const texto = this.nuevoMensaje.trim();
    if (!texto || this.enviando || !this.userId) return;

    this.enviando = true;
    this.nuevoMensaje = '';

    try {
      await this.chatService.enviarMensaje(this.userId, this.nombreUsuario, texto);
    } catch (err) {
      console.error('Error al enviar:', err);
      this.nuevoMensaje = texto; // Restaurar si falla
    } finally {
      this.cdr.detectChanges()
      this.enviando = false;
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.enviar();
    }
  }

  private scrollAbajo(): void {
    try {
      this.messagesEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
    } catch {}
  }

  esMio(mensaje: Mensaje): boolean {
    return mensaje.user_id === this.userId;
  }
}