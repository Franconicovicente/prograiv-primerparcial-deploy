import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { AuthService } from '../../../services/auth/auth';
import { PartidaService } from '../../../services/partida-ahorcado/partida';
import { Router, RouterLink } from '@angular/router';

const PALABRAS = [
  'javascript', 'angular', 'supabase', 'componente', 'servicio',
  'interfaz', 'variable', 'funcion', 'promesa', 'observable',
  'typescript', 'directiva', 'modulo', 'router', 'formulario',
  'inyeccion', 'decorador', 'template', 'proyecto', 'desarrollo'
];

const LETRAS = 'abcdefghijklmnopqrstuvwxyz'.split('');
const MAX_ERRORES = 6;

@Component({
  selector: 'app-ahorcado',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './juego-ahorcado.html',
  styleUrls: ['./juego-ahorcado.css']
})
export class AhorcadoComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private partidaService = inject(PartidaService);
  private router = inject(Router)

  // Estado del juego
  palabra: string = '';
  letrasAdivinadas: Set<string> = new Set();
  errores: number = 0;
  estado: 'jugando' | 'ganó' | 'perdió' = 'jugando';
  guardando: boolean = false;
  yaGuardado: boolean = false;

  // Timer
  tiempoSegundos: number = 0;
  private intervalo: any;

  // Datos del usuario
  private userId: string = '';

  readonly letras = LETRAS;
  readonly maxErrores = MAX_ERRORES;

  async ngOnInit(): Promise<void> {
    this.userId = (await this.authService.getUserId()) ?? '';
    this.iniciarPartida();
  }

  ngOnDestroy(): void {
    this.detenerTimer();
  }

  iniciarPartida(): void {
    this.palabra = PALABRAS[Math.floor(Math.random() * PALABRAS.length)];
    this.letrasAdivinadas = new Set();
    this.errores = 0;
    this.estado = 'jugando';
    this.tiempoSegundos = 0;
    this.yaGuardado = false;
    this.detenerTimer();
    this.iniciarTimer();
  }

  seleccionarLetra(letra: string): void {
    if (this.estado !== 'jugando' || this.letrasAdivinadas.has(letra)) return;

    this.letrasAdivinadas.add(letra);

    if (!this.palabra.includes(letra)) {
      this.errores++;
    }

    this.verificarEstado();
  }

  private verificarEstado(): void {
    const gano = this.palabraVisible.every(l => l !== '_');
    const perdio = this.errores >= MAX_ERRORES;

    if (gano) {
      this.estado = 'ganó';
      this.terminarPartida();
    } else if (perdio) {
      this.estado = 'perdió';
      this.terminarPartida();
    }
  }

  private async terminarPartida(): Promise<void> {
    this.detenerTimer();
    if (this.yaGuardado) return;
    this.yaGuardado = true;
    this.guardando = true;

    try {
      await this.partidaService.guardarPartida({
        user_id: this.userId,
        palabra: this.palabra,
        resultado: this.estado as 'ganó' | 'perdió',
        letras_seleccionadas: this.letrasAdivinadas.size,
        tiempo_segundos: this.tiempoSegundos,
        errores: this.errores
      });
    } catch (err) {
      console.error('Error al guardar partida:', err);
    } finally {
      this.guardando = false;
    }
  }

  private iniciarTimer(): void {
    this.intervalo = setInterval(() => this.tiempoSegundos++, 1000);
  }

  private detenerTimer(): void {
    if (this.intervalo) {
      clearInterval(this.intervalo);
      this.intervalo = null;
    }
  }

  salir(){
    this.router.navigate(['/home'])
  }

  // ── Getters para el template ──────────────────────────────

  get palabraVisible(): string[] {
    return this.palabra.split('').map(l => this.letrasAdivinadas.has(l) ? l : '_');
  }

  get tiempoFormateado(): string {
    const m = Math.floor(this.tiempoSegundos / 60).toString().padStart(2, '0');
    const s = (this.tiempoSegundos % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  estaUsada(letra: string): boolean {
    return this.letrasAdivinadas.has(letra);
  }

  esError(letra: string): boolean {
    return this.letrasAdivinadas.has(letra) && !this.palabra.includes(letra);
  }

  esAcierto(letra: string): boolean {
    return this.letrasAdivinadas.has(letra) && this.palabra.includes(letra);
  }

  // Partes del ahorcado a mostrar según errores
  get partes(): boolean[] {
    return Array.from({ length: MAX_ERRORES }, (_, i) => i < this.errores);
  }
}