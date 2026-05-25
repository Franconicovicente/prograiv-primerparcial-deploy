import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, NgZone, HostListener } from '@angular/core';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { AuthService } from '../../../../services/auth/auth';
import { PartidaJuegoPropioService } from '../../../../services/juego-propio/juego-propio';

// ── Constantes ───────────────────────────────────────────
const COLS = 10;
const ROWS = 20;
const PUNTOS_POR_LINEA = [0, 100, 300, 500, 800];

// Colores por tipo de pieza (índice 0 = vacío)
export const COLORES = [
  '',           // 0 vacío
  'piece-i',    // 1 I
  'piece-o',    // 2 O
  'piece-t',    // 3 T
  'piece-s',    // 4 S
  'piece-z',    // 5 Z
  'piece-j',    // 6 J
  'piece-l',    // 7 L
];

// Formas de cada pieza
const PIEZAS: number[][][] = [
  [],
  [[1,1,1,1]],                          // I
  [[2,2],[2,2]],                         // O
  [[0,3,0],[3,3,3]],                     // T
  [[0,4,4],[4,4,0]],                     // S
  [[5,5,0],[0,5,5]],                     // Z
  [[6,0,0],[6,6,6]],                     // J
  [[0,0,7],[7,7,7]],                     // L
];

export interface Celda {
  tipo: number;   // 0 = vacío, 1-7 = pieza
  ghost: boolean;
}

export interface Pieza {
  forma: number[][];
  x: number;
  y: number;
  tipo: number;
}

function crearTablero(): Celda[][] {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ tipo: 0, ghost: false }))
  );
}

function rotar(forma: number[][]): number[][] {
  return forma[0].map((_, i) => forma.map(row => row[i]).reverse());
}

function piezaAleatoria(): Pieza {
  const tipo = Math.floor(Math.random() * 7) + 1;
  const forma = PIEZAS[tipo].map(r => [...r]);
  return { forma, x: Math.floor((COLS - forma[0].length) / 2), y: 0, tipo };
}

@Component({
  selector: 'app-tetris',
  standalone: true,
  imports: [NgIf, NgFor, NgClass],
  templateUrl: './juego-propio.html',
  styleUrls: ['./juego-propio.css'] 
})
export class JuegoPropioComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private partidaService = inject(PartidaJuegoPropioService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  // Tablero visible (incluye pieza activa y ghost)
  tablero: Celda[][] = crearTablero();

  // Estado lógico del tablero (solo piezas fijas)
  private grid: number[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

  // Pieza actual y siguiente
  piezaActual: Pieza | null = null;
  piezaSiguiente: Pieza | null = null;

  // Estado del juego
  estado: 'inicio' | 'jugando' | 'pausado' | 'fin' = 'inicio';
  puntuacion: number = 0;
  lineas: number = 0;
  nivel: number = 1;
  guardando: boolean = false;

  private userId: string = '';
  private dropInterval: any;
  private yaGuardado: boolean = false;

  readonly colores = COLORES;
  readonly filas = Array.from({ length: ROWS }, (_, i) => i);
  readonly columnas = Array.from({ length: COLS }, (_, i) => i);

  async ngOnInit(): Promise<void> {
    this.userId = (await this.authService.getUserId()) ?? '';
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.detenerLoop();
  }

  // ── Controles ────────────────────────────────────────────

  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (this.estado !== 'jugando') return;
    switch (e.key) {
      case 'ArrowLeft':  e.preventDefault(); this.mover(-1); break;
      case 'ArrowRight': e.preventDefault(); this.mover(1);  break;
      case 'ArrowDown':  e.preventDefault(); this.bajar();   break;
      case 'ArrowUp':    e.preventDefault(); this.girar();   break;
      case ' ':          e.preventDefault(); this.caerDuro(); break;
      case 'p':
      case 'P':          this.pausar(); break;
    }
  }

  // Botones táctiles
  btnIzquierda(): void  { if (this.estado === 'jugando') this.mover(-1); }
  btnDerecha(): void    { if (this.estado === 'jugando') this.mover(1);  }
  btnBajar(): void      { if (this.estado === 'jugando') this.bajar();   }
  btnRotar(): void      { if (this.estado === 'jugando') this.girar();   }
  btnCaer(): void       { if (this.estado === 'jugando') this.caerDuro(); }

  // ── Lógica principal ─────────────────────────────────────

  iniciarJuego(): void {
    this.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    this.tablero = crearTablero();
    this.puntuacion = 0;
    this.lineas = 0;
    this.nivel = 1;
    this.yaGuardado = false;
    this.piezaSiguiente = piezaAleatoria();
    this.spawnPieza();
    this.estado = 'jugando';
    this.iniciarLoop();
    this.cdr.detectChanges();
  }

  pausar(): void {
    if (this.estado === 'jugando') {
      this.estado = 'pausado';
      this.detenerLoop();
    } else if (this.estado === 'pausado') {
      this.estado = 'jugando';
      this.iniciarLoop();
    }
    this.cdr.detectChanges();
  }

  private spawnPieza(): void {
    this.piezaActual = this.piezaSiguiente ?? piezaAleatoria();
    this.piezaSiguiente = piezaAleatoria();

    // Game over si colisiona al spawnear
    if (this.colisiona(this.piezaActual, 0, 0)) {
      this.gameOver();
      return;
    }
    this.renderizarTablero();
  }

  private mover(dx: number): void {
    if (!this.piezaActual) return;
    if (!this.colisiona(this.piezaActual, dx, 0)) {
      this.piezaActual.x += dx;
      this.renderizarTablero();
      this.cdr.detectChanges();
    }
  }

  private bajar(): void {
    if (!this.piezaActual) return;
    if (!this.colisiona(this.piezaActual, 0, 1)) {
      this.piezaActual.y++;
      this.renderizarTablero();
      this.cdr.detectChanges();
    } else {
      this.fijarPieza();
    }
  }

  private girar(): void {
    if (!this.piezaActual) return;
    const rotada = rotar(this.piezaActual.forma);
    const original = this.piezaActual.forma;
    this.piezaActual.forma = rotada;

    // Wall kick simple
    if (this.colisiona(this.piezaActual, 0, 0)) {
      if (!this.colisiona(this.piezaActual, 1, 0))       this.piezaActual.x++;
      else if (!this.colisiona(this.piezaActual, -1, 0)) this.piezaActual.x--;
      else if (!this.colisiona(this.piezaActual, 2, 0))  this.piezaActual.x += 2;
      else if (!this.colisiona(this.piezaActual, -2, 0)) this.piezaActual.x -= 2;
      else this.piezaActual.forma = original;
    }
    this.renderizarTablero();
    this.cdr.detectChanges();
  }

  private caerDuro(): void {
    if (!this.piezaActual) return;
    while (!this.colisiona(this.piezaActual, 0, 1)) {
      this.piezaActual.y++;
    }
    this.fijarPieza();
  }

  private fijarPieza(): void {
    if (!this.piezaActual) return;
    const { forma, x, y, tipo } = this.piezaActual;
    forma.forEach((fila, fy) => {
      fila.forEach((val, fx) => {
        if (val && y + fy >= 0) {
          this.grid[y + fy][x + fx] = tipo;
        }
      });
    });
    this.limpiarLineas();
    this.spawnPieza();
  }

  private limpiarLineas(): void {
    let lineasLimpias = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (this.grid[r].every(c => c !== 0)) {
        this.grid.splice(r, 1);
        this.grid.unshift(Array(COLS).fill(0));
        lineasLimpias++;
        r++; // re-chequear misma fila
      }
    }
    if (lineasLimpias > 0) {
      this.lineas += lineasLimpias;
      this.puntuacion += PUNTOS_POR_LINEA[lineasLimpias] * this.nivel;
      this.nivel = Math.floor(this.lineas / 10) + 1;
      this.reiniciarLoop();
    }
  }

  private colisiona(pieza: Pieza, dx: number, dy: number): boolean {
    return pieza.forma.some((fila, fy) =>
      fila.some((val, fx) => {
        if (!val) return false;
        const nx = pieza.x + fx + dx;
        const ny = pieza.y + fy + dy;
        return nx < 0 || nx >= COLS || ny >= ROWS || (ny >= 0 && this.grid[ny][nx] !== 0);
      })
    );
  }

  private calcularGhost(): Pieza | null {
    if (!this.piezaActual) return null;
    const ghost: Pieza = { ...this.piezaActual, forma: this.piezaActual.forma.map(r => [...r]) };
    while (!this.colisiona(ghost, 0, 1)) ghost.y++;
    return ghost;
  }

  private renderizarTablero(): void {
    // Copiar grid fijo
    const nuevo: Celda[][] = this.grid.map(fila =>
      fila.map(tipo => ({ tipo, ghost: false }))
    );

    // Dibujar ghost
    const ghost = this.calcularGhost();
    if (ghost && ghost.y !== this.piezaActual!.y) {
      ghost.forma.forEach((fila, fy) => {
        fila.forEach((val, fx) => {
          if (val) {
            const gy = ghost.y + fy;
            const gx = ghost.x + fx;
            if (gy >= 0 && gy < ROWS && gx >= 0 && gx < COLS && nuevo[gy][gx].tipo === 0) {
              nuevo[gy][gx] = { tipo: this.piezaActual!.tipo, ghost: true };
            }
          }
        });
      });
    }

    // Dibujar pieza actual
    if (this.piezaActual) {
      this.piezaActual.forma.forEach((fila, fy) => {
        fila.forEach((val, fx) => {
          if (val) {
            const cy = this.piezaActual!.y + fy;
            const cx = this.piezaActual!.x + fx;
            if (cy >= 0 && cy < ROWS && cx >= 0 && cx < COLS) {
              nuevo[cy][cx] = { tipo: this.piezaActual!.tipo, ghost: false };
            }
          }
        });
      });
    }

    this.tablero = nuevo;
  }

  // ── Game Over ─────────────────────────────────────────────

  private async gameOver(): Promise<void> {
    this.detenerLoop();
    this.estado = 'fin';
    if (this.yaGuardado) return;
    this.yaGuardado = true;
    this.guardando = true;
    this.cdr.detectChanges();

    try {
      await this.partidaService.guardarPartida({
        user_id: this.userId,
        puntuacion: this.puntuacion,
        lineas_completadas: this.lineas,
        nivel_alcanzado: this.nivel
      });
    } catch (err) {
      console.error('Error guardando partida:', err);
    } finally {
      this.guardando = false;
      this.cdr.detectChanges();
    }
  }

  // ── Loop ─────────────────────────────────────────────────

  private get velocidad(): number {
    return Math.max(100, 800 - (this.nivel - 1) * 70);
  }

  private iniciarLoop(): void {
    this.ngZone.runOutsideAngular(() => {
      this.dropInterval = setInterval(() => {
        this.ngZone.run(() => {
          this.bajar();
          this.cdr.detectChanges();
        });
      }, this.velocidad);
    });
  }

  private detenerLoop(): void {
    if (this.dropInterval) {
      clearInterval(this.dropInterval);
      this.dropInterval = null;
    }
  }

  private reiniciarLoop(): void {
    this.detenerLoop();
    this.iniciarLoop();
  }

  // ── Helpers para template ─────────────────────────────────

  getCeldaClass(celda: Celda): string {
    if (!celda.tipo) return '';
    return celda.ghost ? `${COLORES[celda.tipo]} ghost` : COLORES[celda.tipo];
  }

  getSiguienteTablero(): Celda[][] {
    const tablero: Celda[][] = Array.from({ length: 4 }, () =>
      Array.from({ length: 4 }, () => ({ tipo: 0, ghost: false }))
    );
    if (this.piezaSiguiente) {
      this.piezaSiguiente.forma.forEach((fila, fy) => {
        fila.forEach((val, fx) => {
          if (val && fy < 4 && fx < 4) {
            tablero[fy][fx] = { tipo: this.piezaSiguiente!.tipo, ghost: false };
          }
        });
      });
    }
    return tablero;
  }
}