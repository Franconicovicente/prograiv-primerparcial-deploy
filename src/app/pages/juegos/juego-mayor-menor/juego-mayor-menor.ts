import { Component, OnInit, OnDestroy, inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { NgIf, NgClass } from '@angular/common';
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
  // Fisher-Yates shuffle
  for (let i = baraja.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [baraja[i], baraja[j]] = [baraja[j], baraja[i]];
  }
  return baraja;
}

@Component({
  selector: 'app-mayor-menor',
  standalone: true,
  imports: [NgIf],
  templateUrl: './juego-mayor-menor.html',
  styleUrls: ['./juego-mayor-menor.css']
})
export class MayorMenorComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private partidaService = inject(PartidaMayorMenorService);
  private router = inject(Router)
  
  // Baraja y cartas
  private baraja: Carta[] = [];
  cartaActual: Carta | null = null;
  cartaSiguiente: Carta | null = null;
  private ngZone = inject(NgZone)
  private cdr = inject(ChangeDetectorRef);


  // Estado
  estado: 'jugando' | 'resultado' | 'fin' = 'jugando';
  ultimoResultado: 'correcto' | 'incorrecto' | null = null;
  acerto: boolean = false;

  // Stats
  cartasAcertadas: number = 0;
  cartasTotales: number = 0;
  private indice: number = 1;

  // Timer
  tiempoSegundos: number = 0;
  private intervalo: any;

  // Guardado
  private userId: string = '';
  guardando: boolean = false;
  yaGuardado: boolean = false;

  async ngOnInit(): Promise<void> {
    this.userId = (await this.authService.getUserId()) ?? '';
    this.iniciarPartida();
  }

  ngOnDestroy(): void {
    this.detenerTimer();
  }

  iniciarPartida(): void {
    this.baraja = generarBaraja();
    this.cartaActual = this.baraja[0];
    this.cartaSiguiente = null;
    this.indice = 1;
    this.cartasAcertadas = 0;
    this.cartasTotales = 0;
    this.estado = 'jugando';
    this.ultimoResultado = null;
    this.yaGuardado = false;
    this.tiempoSegundos = 0;
    this.detenerTimer();
    this.iniciarTimer();
  }

  elegir(eleccion: 'mayor' | 'menor'): void {
    if (this.estado !== 'jugando') return;

    this.cartaSiguiente = this.baraja[this.indice];
    this.cartasTotales++;

    const esM = this.cartaSiguiente.valor > this.cartaActual!.valor;
    const esMen = this.cartaSiguiente.valor < this.cartaActual!.valor;
    const empate = this.cartaSiguiente.valor === this.cartaActual!.valor;

    if (empate) {
      // Empate cuenta como incorrecto
      this.acerto = false;
    } else {
      this.acerto = (eleccion === 'mayor' && esM) || (eleccion === 'menor' && esMen);
    }

    if (this.acerto) this.cartasAcertadas++;
    this.ultimoResultado = this.acerto ? 'correcto' : 'incorrecto';
    this.estado = 'resultado';

    // Mostrar resultado brevemente y continuar
    this.ngZone.runOutsideAngular(() => {
    setTimeout(() => {
      this.ngZone.run(() => {
        this.avanzar();
        this.cdr.detectChanges();
      });
    }, 1200);
  });
  
  }

  private avanzar(): void {
    this.cartaActual = this.cartaSiguiente;
    this.indice++;

    if (this.indice >= this.baraja.length) {
      this.terminarPartida('ganó');
    } else if (!this.acerto) {
      // 3 errores seguidos no, pero si querés podés cambiar la lógica
      // Por ahora: se pierde si falla 3 veces
      this.erroresConsecutivos++;
      if (this.erroresConsecutivos >= 3) {
        this.terminarPartida('perdió');
        return;
      }
      this.estado = 'jugando';
      this.ultimoResultado = null;
    } else {
      this.erroresConsecutivos = 0;
      this.estado = 'jugando';
      this.ultimoResultado = null;
    }
  }

  private erroresConsecutivos: number = 0;

  private async terminarPartida(resultado: 'ganó' | 'perdió'): Promise<void> {
    this.detenerTimer();
    this.estado = 'fin';
    if (this.yaGuardado) return;
    this.yaGuardado = true;
    this.guardando = true;

    try {
      await this.partidaService.guardarPartida({
        user_id: this.userId,
        cartas_acertadas: this.cartasAcertadas,
        cartas_totales: this.cartasTotales,
        resultado,
        tiempo_segundos: this.tiempoSegundos
      });
    } catch (err) {
      console.error('Error al guardar partida:', err);
    } finally {
      this.guardando = false;
    }
  }

  private iniciarTimer(): void {
      this.ngZone.runOutsideAngular(() => {
      this.intervalo = setInterval(() => {
        this.tiempoSegundos++;
        this.cdr.detectChanges();
      }, 1000);
    });
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

  // ── Getters ──────────────────────────────

  get tiempoFormateado(): string {
    const m = Math.floor(this.tiempoSegundos / 60).toString().padStart(2, '0');
    const s = (this.tiempoSegundos % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  get esRoja(): boolean {
    return this.cartaActual?.palo === '♥' || this.cartaActual?.palo === '♦';
  }

  get porcentajeAciertos(): number {
    if (this.cartasTotales === 0) return 0;
    return Math.round((this.cartasAcertadas / this.cartasTotales) * 100);
  }

  get cartasRestantes(): number {
    return this.baraja.length - this.indice + 1;
  }
}