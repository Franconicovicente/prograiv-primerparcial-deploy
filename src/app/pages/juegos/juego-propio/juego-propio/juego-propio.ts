import { Component, OnInit, OnDestroy, inject, NgZone, HostListener, signal, computed } from '@angular/core'; // 👈 Agregamos signal y computed
import { NgClass } from '@angular/common';
import { AuthService } from '../../../../services/auth/auth';
import { PartidaJuegoPropioService } from '../../../../services/juego-propio/juego-propio';
import { Celda, Pieza } from '../../../../models/tetris.model';

const COLS = 10;
const ROWS = 20;
const PUNTOS_POR_LINEA = [0, 100, 300, 500, 800];

export const COLORES = [
  '', 'piece-i', 'piece-o', 'piece-t', 'piece-s', 'piece-z', 'piece-j', 'piece-l',
];

const PIEZAS: number[][][] = [
  [],
  [[1,1,1,1]],                  // I
  [[2,2],[2,2]],                // O
  [[0,3,0],[3,3,3]],            // T
  [[0,4,4],[4,4,0]],            // S
  [[5,5,0],[0,5,5]],            // Z
  [[6,0,0],[6,6,6]],            // J
  [[0,0,7],[7,7,7]],            // L
];


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
  imports: [NgClass],
  templateUrl: './juego-propio.html',
  styleUrls: ['./juego-propio.css'] 
})
export class JuegoPropioComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private partidaService = inject(PartidaJuegoPropioService);
  private ngZone = inject(NgZone);
  // 👈 Borramos ChangeDetectorRef, ya no hace falta

  // ── Estados pasados a Signals ───────────────────────────
  tablero = signal<Celda[][]>(crearTablero());
  piezaActual = signal<Pieza | null>(null);
  piezaSiguiente = signal<Pieza | null>(null);

  estado = signal<'inicio' | 'jugando' | 'pausado' | 'fin'>('inicio');
  puntuacion = signal<number>(0);
  lineas = signal<number>(0);
  nivel = signal<number>(1);
  guardando = signal<boolean>(false);

  // El grid interno sigue igual por ser lógica pura del motor del juego
  private grid: number[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  private userId: string = '';
  private dropInterval: any;
  private yaGuardado: boolean = false;

  readonly colores = COLORES;
  readonly filas = Array.from({ length: ROWS }, (_, i) => i);
  readonly columnas = Array.from({ length: COLS }, (_, i) => i);

  // ── Computed para el mini-tablero de la siguiente pieza ─
  siguienteTablero = computed<Celda[][]>(() => {
    const tableroVacio: Celda[][] = Array.from({ length: 4 }, () =>
      Array.from({ length: 4 }, () => ({ tipo: 0, ghost: false }))
    );
    const sig = this.piezaSiguiente(); // 👈 Se suscribe al signal
    if (sig) {
      sig.forma.forEach((fila, fy) => {
        fila.forEach((val, fx) => {
          if (val && fy < 4 && fx < 4) {
            tableroVacio[fy][fx] = { tipo: sig.tipo, ghost: false };
          }
        });
      });
    }
    return tableroVacio;
  });

  async ngOnInit(): Promise<void> {
    this.userId = (await this.authService.getUserId()) ?? '';
    // Chau detectChanges
  }

  ngOnDestroy(): void {
    this.detenerLoop();
  }

  // ── Controles ────────────────────────────────────────────

  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (this.estado() !== 'jugando') return; // 👈 Leemos con ()
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

  btnIzquierda(): void  { if (this.estado() === 'jugando') this.mover(-1); }
  btnDerecha(): void    { if (this.estado() === 'jugando') this.mover(1);  }
  btnBajar(): void      { if (this.estado() === 'jugando') this.bajar();   }
  btnRotar(): void      { if (this.estado() === 'jugando') this.girar();   }
  btnCaer(): void       { if (this.estado() === 'jugando') this.caerDuro(); }

  // ── Lógica principal ─────────────────────────────────────

  iniciarJuego(): void {
    this.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    this.tablero.set(crearTablero()); // 👈 Seteamos con .set()
    this.puntuacion.set(0);
    this.lineas.set(0);
    this.nivel.set(1);
    this.yaGuardado = false;
    this.piezaSiguiente.set(piezaAleatoria());
    this.spawnPieza();
    this.estado.set('jugando');
    this.iniciarLoop();
  }

  pausar(): void {
    if (this.estado() === 'jugando') {
      this.estado.set('pausado');
      this.detenerLoop();
    } else if (this.estado() === 'pausado') {
      this.estado.set('jugando');
      this.iniciarLoop();
    }
  }

  private spawnPieza(): void {
    const siguiente = this.piezaSiguiente();
    this.piezaActual.set(siguiente ?? piezaAleatoria());
    this.piezaSiguiente.set(piezaAleatoria());

    if (this.colisiona(this.piezaActual()!, 0, 0)) {
      this.gameOver();
      return;
    }
    this.renderizarTablero();
  }

  private mover(dx: number): void {
    const actual = this.piezaActual();
    if (!actual) return;
    if (!this.colisiona(actual, dx, 0)) {
      actual.x += dx;
      this.piezaActual.set({ ...actual }); // 👈 Desestructuramos para notificar el cambio de objeto
      this.renderizarTablero();
    }
  }

  private bajar(): void {
    const actual = this.piezaActual();
    if (!actual) return;
    if (!this.colisiona(actual, 0, 1)) {
      actual.y++;
      this.piezaActual.set({ ...actual });
      this.renderizarTablero();
    } else {
      this.fijarPieza();
    }
  }

  private girar(): void {
    const actual = this.piezaActual();
    if (!actual) return;
    const rotada = rotar(actual.forma);
    const original = actual.forma;
    actual.forma = rotada;

    if (this.colisiona(actual, 0, 0)) {
      if (!this.colisiona(actual, 1, 0))       actual.x++;
      else if (!this.colisiona(actual, -1, 0)) actual.x--;
      else if (!this.colisiona(actual, 2, 0))  actual.x += 2;
      else if (!this.colisiona(actual, -2, 0)) actual.x -= 2;
      else actual.forma = original;
    }
    this.piezaActual.set({ ...actual });
    this.renderizarTablero();
  }

  private caerDuro(): void {
    const actual = this.piezaActual();
    if (!actual) return;
    while (!this.colisiona(actual, 0, 1)) {
      actual.y++;
    }
    this.piezaActual.set({ ...actual });
    this.fijarPieza();
  }

  private fijarPieza(): void {
    const actual = this.piezaActual();
    if (!actual) return;
    const { forma, x, y, tipo } = actual;
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
        r++;
      }
    }
    if (lineasLimpias > 0) {
      this.lineas.update(l => l + lineasLimpias); // 👈 Usamos .update() para acumular valores
      this.puntuacion.update(p => p + PUNTOS_POR_LINEA[lineasLimpias] * this.nivel());
      this.nivel.set(Math.floor(this.lineas() / 10) + 1);
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
    const actual = this.piezaActual();
    if (!actual) return null;
    const ghost: Pieza = { ...actual, forma: actual.forma.map(r => [...r]) };
    while (!this.colisiona(ghost, 0, 1)) ghost.y++;
    return ghost;
  }

  private renderizarTablero(): void {
    const nuevo: Celda[][] = this.grid.map(fila =>
      fila.map(tipo => ({ tipo, ghost: false }))
    );

    const actual = this.piezaActual();
    const ghost = this.calcularGhost();
    
    if (actual && ghost && ghost.y !== actual.y) {
      ghost.forma.forEach((fila, fy) => {
        fila.forEach((val, fx) => {
          if (val) {
            const gy = ghost.y + fy;
            const gx = ghost.x + fx;
            if (gy >= 0 && gy < ROWS && gx >= 0 && gx < COLS && nuevo[gy][gx].tipo === 0) {
              nuevo[gy][gx] = { tipo: actual.tipo, ghost: true };
            }
          }
        });
      });
    }

    if (actual) {
      actual.forma.forEach((fila, fy) => {
        fila.forEach((val, fx) => {
          if (val) {
            const cy = actual.y + fy;
            const cx = actual.x + fx;
            if (cy >= 0 && cy < ROWS && cx >= 0 && cx < COLS) {
              nuevo[cy][cx] = { tipo: actual.tipo, ghost: false };
            }
          }
        });
      });
    }

    this.tablero.set(nuevo); // 👈 Notificamos el cambio al signal del tablero
  }

  private async gameOver(): Promise<void> {
    this.detenerLoop();
    this.estado.set('fin');
    if (this.yaGuardado) return;
    this.yaGuardado = true;
    this.guardando.set(true);

    try {
      await this.partidaService.guardarPartida({
        user_id: this.userId,
        puntuacion: this.puntuacion(),
        lineas_completadas: this.lineas(),
        nivel_alcanzado: this.nivel()
      });
    } catch (err) {
      console.error('Error guardando partida:', err);
    } finally {
      this.guardando.set(false);
    }
  }

  private get velocidad(): number {
    return Math.max(100, 800 - (this.nivel() - 1) * 70);
  }

  private iniciarLoop(): void {
    this.ngZone.runOutsideAngular(() => {
      this.dropInterval = setInterval(() => {
        this.ngZone.run(() => {
          this.bajar();
          // Ya no necesitamos cdr.detectChanges();
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

  getCeldaClass(celda: Celda): string {
    if (!celda.tipo) return '';
    return celda.ghost ? `${COLORES[celda.tipo]} ghost` : COLORES[celda.tipo];
  }
}