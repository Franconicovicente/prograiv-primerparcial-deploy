import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { AuthService } from '../../../../services/auth/auth';
import { PartidaPreguntadosService } from '../../../../services/partida-preguntados/partida-preguntados';
import { Router, RouterLink } from '@angular/router';

const TOTAL_PREGUNTAS = 10;
const TIMER_SEGUNDOS = 15;

export interface Pais {
  code: string;
  name: string;
}

@Component({
  selector: 'app-preguntados',
  standalone: true,
  imports: [NgIf, NgFor],
  templateUrl: './juego-preguntados.html',
  styleUrls: ['./juego-preguntados.css']
})
export class PreguntadosComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private partidaService = inject(PartidaPreguntadosService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private router = inject (Router)

  // Datos
  todosPaises: Pais[] = [];
  paisActual: Pais | null = null;
  opciones: Pais[] = [];
  svgPath: string = '';

  // Estado
  estado: 'cargando' | 'jugando' | 'respondido' | 'fin' = 'cargando';
  respuestaSeleccionada: Pais | null = null;
  esCorrecta: boolean = false;

  // Stats
  preguntaActual: number = 0;
  correctas: number = 0;
  tiempoTotal: number = 0;

  // Timer
  timerSegundos: number = TIMER_SEGUNDOS;
  private timerInterval: any;
  private tiempoInterval: any;

  // Guardado
  private userId: string = '';
  guardando: boolean = false;

  readonly totalPreguntas = TOTAL_PREGUNTAS;

  async ngOnInit(): Promise<void> {
    this.userId = (await this.authService.getUserId()) ?? '';
    await this.cargarPaises();
    this.iniciarPartida();
  }

  ngOnDestroy(): void {
    this.limpiarTimers();
  }

  private async cargarPaises(): Promise<void> {
    try {
      const res = await fetch('https://restcountries.com/v3.1/all?fields=cca2,name');
      const data = await res.json();
      this.todosPaises = data
        .map((p: any) => ({ code: p.cca2, name: p.name.common }))
        .filter((p: Pais) => p.code && p.name)
        .sort(() => Math.random() - 0.5);
    } catch (err) {
      console.error('Error cargando países:', err);
    }
  }

  iniciarPartida(): void {
    this.preguntaActual = 0;
    this.correctas = 0;
    this.tiempoTotal = 0;
    this.estado = 'jugando';
    this.limpiarTimers();
    this.iniciarTiempoTotal();
    this.cargarPregunta();
  }

  private cargarPregunta(): void {
    if (this.preguntaActual >= TOTAL_PREGUNTAS) {
      this.terminarPartida();
      return;
    }

    // Pais correcto
    const idx = Math.floor(Math.random() * this.todosPaises.length);
    this.paisActual = this.todosPaises[idx];
    this.svgPath = '';
    this.respuestaSeleccionada = null;
    this.esCorrecta = false;
    this.estado = 'jugando';

    // Opciones: 1 correcta + 3 falsas
    const falsas = this.todosPaises
      .filter(p => p.code !== this.paisActual!.code)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    this.opciones = [...falsas, this.paisActual].sort(() => Math.random() - 0.5);

    this.cdr.detectChanges();
    this.iniciarTimer();
  }

  responder(opcion: Pais): void {
    if (this.estado !== 'jugando') return;
    this.limpiarTimer();

    this.respuestaSeleccionada = opcion;
    this.esCorrecta = opcion.code === this.paisActual!.code;
    if (this.esCorrecta) this.correctas++;

    this.estado = 'respondido';
    this.preguntaActual++;
    this.cdr.detectChanges();

    // Siguiente pregunta después de 2 segundos
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        this.ngZone.run(() => {
          this.cargarPregunta();
          this.cdr.detectChanges();
        });
      }, 2000);
    });
  }

  private tiempoAgotado(): void {
    if (this.estado !== 'jugando') return;
    this.limpiarTimer();
    this.respuestaSeleccionada = null;
    this.esCorrecta = false;
    this.estado = 'respondido';
    this.preguntaActual++;
    this.cdr.detectChanges();

    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        this.ngZone.run(() => {
          this.cargarPregunta();
          this.cdr.detectChanges();
        });
      }, 2000);
    });
  }

  private async terminarPartida(): Promise<void> {
    this.limpiarTimers();
    this.estado = 'fin';
    this.guardando = true;
    this.cdr.detectChanges();

    try {
      await this.partidaService.guardarPartida({
        user_id: this.userId,
        respuestas_correctas: this.correctas,
        respuestas_totales: TOTAL_PREGUNTAS,
        resultado: this.correctas >= 5 ? 'ganó' : 'perdió',
        tiempo_segundos: this.tiempoTotal
      });
    } catch (err) {
      console.error('Error guardando partida:', err);
    } finally {
      this.guardando = false;
      this.cdr.detectChanges();
    }
  }

  salir(){
    this.router.navigate(['/home'])
  }

  // ── Timers ──────────────────────────────

  private iniciarTimer(): void {
    this.timerSegundos = TIMER_SEGUNDOS;
    this.ngZone.runOutsideAngular(() => {
      this.timerInterval = setInterval(() => {
        this.ngZone.run(() => {
          this.timerSegundos--;
          if (this.timerSegundos <= 0) {
            this.limpiarTimer();
            this.tiempoAgotado();
          }
          this.cdr.detectChanges();
        });
      }, 1000);
    });
  }

  private iniciarTiempoTotal(): void {
    this.ngZone.runOutsideAngular(() => {
      this.tiempoInterval = setInterval(() => {
        this.ngZone.run(() => {
          this.tiempoTotal++;
          this.cdr.detectChanges();
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

  // ── Getters ──────────────────────────────

  get porcentajeTimer(): number {
    return (this.timerSegundos / TIMER_SEGUNDOS) * 100;
  }

  get porcentajeAciertos(): number {
    return Math.round((this.correctas / TOTAL_PREGUNTAS) * 100);
  }

  get tiempoFormateado(): string {
    const m = Math.floor(this.tiempoTotal / 60).toString().padStart(2, '0');
    const s = (this.tiempoTotal % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  get progresoBarWidth(): number {
    return ((this.preguntaActual) / TOTAL_PREGUNTAS) * 100;
  }

  getFlagUrl(code: string): string {
    return `https://flagcdn.com/w320/${code.toLowerCase()}.png`;
  }

  getMapUrl(code: string): string {
    return `https://raw.githubusercontent.com/djaiss/mapsicon/master/all/${code.toLowerCase()}/512.png`;
  }

  esRespuestaCorrecta(opcion: Pais): boolean {
    return this.estado === 'respondido' && opcion.code === this.paisActual!.code;
  }

  esRespuestaIncorrecta(opcion: Pais): boolean {
    return this.estado === 'respondido' &&
      this.respuestaSeleccionada?.code === opcion.code &&
      opcion.code !== this.paisActual!.code;
  }
}