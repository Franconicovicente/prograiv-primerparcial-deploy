import { Component, OnInit, OnDestroy, inject, NgZone, signal, computed } from '@angular/core';
import { AuthService } from '../../../services/auth/auth';
import { PartidaMayorMenorService } from '../../../services/partida-mayor-menor/partida-mayor-menor';
import { Router } from '@angular/router';

export interface Carta {
  valor: number;
  palo: '♠' | '♥' | '♦' | '♣';
  nombre: string;
}

const PALOS: Carta['palo'][] = ['♠', '♥', '♦', '♣'];
const NOMBRES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function generarBaraja(): Carta[] {
  const baraja: Carta[] = [];
  for (const palo of PALOS) {
    for (let i = 0; i < NOMBRES.length; i++) {
      baraja.push({ valor: i + 1, palo, nombre: NOMBRES[i] });
    }
  }
  for (let i = baraja.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [baraja[i], baraja[j]] = [baraja[j], baraja[i]];
  }
  return baraja;
}

@Component({
  selector: 'app-mayor-menor',
  standalone: true,
  imports: [],
  templateUrl: './juego-mayor-menor.html',
  styleUrls: ['./juego-mayor-menor.css']
})
export class MayorMenorComponent implements OnInit, OnDestroy {
  // ── Inyecciones ──────────────────────────────────────────
  private authService = inject(AuthService);
  private partidaService = inject(PartidaMayorMenorService);
  private router = inject(Router);
  private ngZone = inject(NgZone);

  // ── Signals de Datos ─────────────────────────────────────
  cartaActual = signal<Carta | null>(null);
  cartaSiguiente = signal<Carta | null>(null);

  // ── Signals de Estado ────────────────────────────────────
  estado = signal<'jugando' | 'resultado' | 'fin'>('jugando');
  ultimoResultado = signal<'correcto' | 'incorrecto' | null>(null);

  // ── Signals de Estadísticas ──────────────────────────────
  cartasAcertadas = signal<number>(0);
  cartasTotales = signal<number>(0);
  tiempoSegundos = signal<number>(0);
  guardando = signal<boolean>(false);

  // ── Propiedades Privadas e Inmutables ────────────────────
  private baraja: Carta[] = [];
  private indice: number = 1;
  private erroresConsecutivos: number = 0;
  private intervalo: any;
  private userId: string = '';
  private yaGuardado: boolean = false;
  private acerto: boolean = false;

  // ── Computed Props (Getters) ─────────────────────────────
  tiempoFormateado = computed<string>(() => {
    const total = this.tiempoSegundos();
    const m = Math.floor(total / 60).toString().padStart(2, '0');
    const s = (total % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  });

  esRoja = computed<boolean>(() => {
    const actual = this.cartaActual();
    return actual?.palo === '♥' || actual?.palo === '♦';
  });

  porcentajeAciertos = computed<number>(() => {
    const totales = this.cartasTotales();
    if (totales === 0) return 0;
    return Math.round((this.cartasAcertadas() / totales) * 100);
  });

  cartasRestantes = computed<number>(() => {
    return this.baraja.length - this.indice + 1;
  });

  // ── Ciclo de Vida ────────────────────────────────────────
  async ngOnInit(): Promise<void> {
    this.userId = (await this.authService.getUserId()) ?? '';
    this.iniciarPartida();
  }

  ngOnDestroy(): void {
    this.detenerTimer();
  }

  // ── Flujo Principal del Juego ────────────────────────────
  iniciarPartida(): void {
    this.baraja = generarBaraja();
    this.cartaActual.set(this.baraja[0]);
    this.cartaSiguiente.set(null);
    this.indice = 1;
    this.erroresConsecutivos = 0;
    this.cartasAcertadas.set(0);
    this.cartasTotales.set(0);
    this.estado.set('jugando');
    this.ultimoResultado.set(null);
    this.yaGuardado = false;
    this.tiempoSegundos.set(0);
    this.detenerTimer();
    this.iniciarTimer();
  }

  elegir(eleccion: 'mayor' | 'menor'): void {
    if (this.estado() !== 'jugando') return;

    const siguiente = this.baraja[this.indice];
    this.cartaSiguiente.set(siguiente);
    this.cartasTotales.update(t => t + 1);

    const actual = this.cartaActual();
    const esM = siguiente.valor > actual!.valor;
    const esMen = siguiente.valor < actual!.valor;
    const empate = siguiente.valor === actual!.valor;

    if (empate) {
      this.acerto = false;
    } else {
      this.acerto = (eleccion === 'mayor' && esM) || (eleccion === 'menor' && esMen);
    }

    if (this.acerto) {
      this.cartasAcertadas.update(a => a + 1);
    }

    this.ultimoResultado.set(this.acerto ? 'correcto' : 'incorrecto');
    this.estado.set('resultado');

    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        this.ngZone.run(() => {
          this.avanzar();
        });
      }, 1200);
    });
  }

  private avanzar(): void {
    this.cartaActual.set(this.cartaSiguiente());
    this.indice++;

    if (this.indice >= this.baraja.length) {
      this.terminarPartida('ganó');
    } else if (!this.acerto) {
      this.erroresConsecutivos++;
      if (this.erroresConsecutivos >= 3) {
        this.terminarPartida('perdió');
        return;
      }
      this.estado.set('jugando');
      this.ultimoResultado.set(null);
    } else {
      this.erroresConsecutivos = 0;
      this.estado.set('jugando');
      this.ultimoResultado.set(null);
    }
  }

  // ── Persistencia y Salida ────────────────────────────────
  private async terminarPartida(resultado: 'ganó' | 'perdió'): Promise<void> {
    this.detenerTimer();
    this.estado.set('fin');
    if (this.yaGuardado) return;
    this.yaGuardado = true;
    this.guardando.set(true);

    try {
      await this.partidaService.guardarPartida({
        user_id: this.userId,
        cartas_acertadas: this.cartasAcertadas(),
        cartas_totales: this.cartasTotales(),
        resultado,
        tiempo_segundos: this.tiempoSegundos()
      });
    } catch (err) {
      console.error('Error al guardar partida:', err);
    } finally {
      this.guardando.set(false);
    }
  }

  salir(): void {
    this.router.navigate(['/home']);
  }

  // ── Lógica de Timers ─────────────────────────────────────
  private iniciarTimer(): void {
    this.ngZone.runOutsideAngular(() => {
      this.intervalo = setInterval(() => {
        this.ngZone.run(() => {
          this.tiempoSegundos.update(t => t + 1);
        });
      }, 1000);
    });
  }

  private detenerTimer(): void {
    if (this.intervalo) {
      clearInterval(this.intervalo);
      this.intervalo = null;
    }
  }
}