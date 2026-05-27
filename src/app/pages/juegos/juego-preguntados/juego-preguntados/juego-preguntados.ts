import { Component, OnInit, OnDestroy, inject, NgZone, signal, computed } from '@angular/core';
import { AuthService } from '../../../../services/auth/auth';
import { PartidaPreguntadosService } from '../../../../services/partida-preguntados/partida-preguntados';
import { Router } from '@angular/router';
import { PaisesService } from '../../../../services/paises/paises';

const TOTAL_PREGUNTAS = 10;
const TIMER_SEGUNDOS = 15;

export interface Pais {
  code: string;
  name: string;
}

@Component({
  selector: 'app-preguntados',
  standalone: true,
  imports: [],
  templateUrl: './juego-preguntados.html',
  styleUrls: ['./juego-preguntados.css']
})
export class PreguntadosComponent implements OnInit, OnDestroy {
  // ── Inyecciones ──────────────────────────────────────────
  private authService = inject(AuthService);
  private partidaService = inject(PartidaPreguntadosService);
  private ngZone = inject(NgZone);
  private router = inject(Router);
  private paisesService = inject(PaisesService)

  // ── Signals de Datos ─────────────────────────────────────
  todosPaises = signal<Pais[]>([]);
  paisActual = signal<Pais | null>(null);
  opciones = signal<Pais[]>([]);
  svgPath = signal<string>('');

  // ── Signals de Estado ────────────────────────────────────
  estado = signal<'cargando' | 'jugando' | 'respondido' | 'fin'>('cargando');
  respuestaSeleccionada = signal<Pais | null>(null);
  esCorrecta = signal<boolean>(false);

  // ── Signals de Estadísticas ──────────────────────────────
  preguntaActual = signal<number>(0);
  correctas = signal<number>(0);
  tiempoTotal = signal<number>(0);
  timerSegundos = signal<number>(TIMER_SEGUNDOS);
  guardando = signal<boolean>(false);

  // ── Propiedades Privadas e Inmutables ────────────────────
  private timerInterval: any;
  private tiempoInterval: any;
  private userId: string = '';
  readonly totalPreguntas = TOTAL_PREGUNTAS;

  // ── Computed Props (Getters) ─────────────────────────────
  porcentajeTimer = computed<number>(() => {
    return (this.timerSegundos() / TIMER_SEGUNDOS) * 100;
  });

  porcentajeAciertos = computed<number>(() => {
    return Math.round((this.correctas() / TOTAL_PREGUNTAS) * 100);
  });

  tiempoFormateado = computed<string>(() => {
    const total = this.tiempoTotal();
    const m = Math.floor(total / 60).toString().padStart(2, '0');
    const s = (total % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  });

  progresoBarWidth = computed<number>(() => {
    return (this.preguntaActual() / TOTAL_PREGUNTAS) * 100;
  });

  // ── Ciclo de Vida ────────────────────────────────────────
  async ngOnInit(): Promise<void> {
  this.userId = (await this.authService.getUserId()) ?? '';
  await this.paisesService.cargarPaises();
  this.iniciarPartida();
}

  ngOnDestroy(): void {
    this.limpiarTimers();
  }

  // ── Métodos de Carga y Flujo ─────────────────────────────
  
  iniciarPartida(): void {
    this.preguntaActual.set(0);
    this.correctas.set(0);
    this.tiempoTotal.set(0);
    this.estado.set('jugando');
    this.limpiarTimers();
    this.iniciarTiempoTotal();
    this.cargarPregunta();
  }

  private cargarPregunta(): void {
    if (this.preguntaActual() >= TOTAL_PREGUNTAS) {
      this.terminarPartida();
      return;
    }

    const paises = this.todosPaises();
    const idx = Math.floor(Math.random() * paises.length);
    const seleccionado = paises[idx];

    this.paisActual.set(seleccionado);
    this.svgPath.set('');
    this.respuestaSeleccionada.set(null);
    this.esCorrecta.set(false);
    this.estado.set('jugando');

    const falsas = paises
      .filter(p => p.code !== seleccionado.code)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    this.opciones.set([...falsas, seleccionado].sort(() => Math.random() - 0.5));
    this.iniciarTimer();
  }

  // ── Acciones del Jugador ─────────────────────────────────
  responder(opcion: Pais): void {
    if (this.estado() !== 'jugando') return;
    this.limpiarTimer();

    this.respuestaSeleccionada.set(opcion);
    const acerto = opcion.code === this.paisActual()!.code;
    this.esCorrecta.set(acerto);
    
    if (acerto) {
      this.correctas.update(c => c + 1);
    }

    this.estado.set('respondido');
    this.preguntaActual.update(p => p + 1);

    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        this.ngZone.run(() => {
          this.cargarPregunta();
        });
      }, 2000);
    });
  }

  private tiempoAgotado(): void {
    if (this.estado() !== 'jugando') return;
    this.limpiarTimer();
    this.respuestaSeleccionada.set(null);
    this.esCorrecta.set(false);
    this.estado.set('respondido');
    this.preguntaActual.update(p => p + 1);

    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        this.ngZone.run(() => {
          this.cargarPregunta();
        });
      }, 2000);
    });
  }

  // ── Persistencia y Salida ────────────────────────────────
  private async terminarPartida(): Promise<void> {
    this.limpiarTimers();
    this.estado.set('fin');
    this.guardando.set(true);

    try {
      await this.partidaService.guardarPartida({
        user_id: this.userId,
        respuestas_correctas: this.correctas(),
        respuestas_totales: TOTAL_PREGUNTAS,
        resultado: this.correctas() >= 5 ? 'ganó' : 'perdió',
        tiempo_segundos: this.tiempoTotal()
      });
    } catch (err) {
      console.error('Error guardando partida:', err);
    } finally {
      this.guardando.set(false);
    }
  }

  salir(): void {
    this.router.navigate(['/home']);
  }

  // ── Lógica de Timers ─────────────────────────────────────
  private iniciarTimer(): void {
    this.timerSegundos.set(TIMER_SEGUNDOS);
    this.ngZone.runOutsideAngular(() => {
      this.timerInterval = setInterval(() => {
        this.ngZone.run(() => {
          this.timerSegundos.update(t => t - 1);
          if (this.timerSegundos() <= 0) {
            this.limpiarTimer();
            this.tiempoAgotado();
          }
        });
      }, 1000);
    });
  }

  private iniciarTiempoTotal(): void {
    this.ngZone.runOutsideAngular(() => {
      this.tiempoInterval = setInterval(() => {
        this.ngZone.run(() => {
          this.tiempoTotal.update(t => t + 1);
        });
      }, 1000);
    });
  }

  private limpiarTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private limpiarTimers(): void {
    this.limpiarTimer();
    if (this.tiempoInterval) {
      clearInterval(this.tiempoInterval);
      this.tiempoInterval = null;
    }
  }

  // ── Helpers de URLs y Clases para Template ───────────────
  getFlagUrl(code: string): string {
    return `https://flagcdn.com/w320/${code.toLowerCase()}.png`;
  }

  getMapUrl(code: string): string {
    return `https://raw.githubusercontent.com/djaiss/mapsicon/master/all/${code.toLowerCase()}/512.png`;
  }

  esRespuestaCorrecta(opcion: Pais): boolean {
    return this.estado() === 'respondido' && opcion.code === this.paisActual()!.code;
  }

  esRespuestaIncorrecta(opcion: Pais): boolean {
    const seleccionada = this.respuestaSeleccionada();
    return this.estado() === 'respondido' &&
      seleccionada?.code === opcion.code &&
      opcion.code !== this.paisActual()!.code;
  }
}