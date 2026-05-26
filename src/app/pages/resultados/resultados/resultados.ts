import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { NgIf, NgFor, NgClass, DecimalPipe, SlicePipe } from '@angular/common';
import { AuthService } from '../../../services/auth/auth';

export interface FilaResultado {
  posicion: number;
  nombre: string;
  puntajePrincipal: number;
  puntajeSecundario?: number;
  extra?: string;
  fecha: string;
  esPropio: boolean;
}

@Component({
  selector: 'app-resultados',
  standalone: true,
  imports: [NgIf, NgFor, SlicePipe],
  templateUrl: './resultados.html',
  styleUrls: ['./resultados.css']
})
export class ResultadosComponent implements OnInit {
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  cargando = true;
  tabActiva: 'ahorcado' | 'mayor-menor' | 'preguntados' | 'tetris' = 'tetris';

  rankingTetris: FilaResultado[] = [];
  rankingAhorcado: FilaResultado[] = [];
  rankingMayorMenor: FilaResultado[] = [];
  rankingPreguntados: FilaResultado[] = [];

  private userId = '';

  async ngOnInit(): Promise<void> {
    this.userId = (await this.authService.getUserId()) ?? '';
    await this.cargarTodos();
    this.cargando = false;
    this.cdr.detectChanges();
  }

  private async cargarTodos(): Promise<void> {
    await Promise.all([
      this.cargarTetris(),
      this.cargarAhorcado(),
      this.cargarMayorMenor(),
      this.cargarPreguntados()
    ]);
  }

  private async cargarTetris(): Promise<void> {
    const { data } = await this.authService.client
      .from('partidas_tetris')
      .select('user_id, puntuacion, lineas_completadas, nivel_alcanzado, created_at, usuarios(nombre, apellido)')
      .order('puntuacion', { ascending: false })
      .limit(50);

    this.rankingTetris = (data || []).map((r: any, i: number) => ({
      posicion: i + 1,
      nombre: `${r.usuarios?.nombre ?? 'Anónimo'} ${r.usuarios?.apellido ?? ''}`.trim(),
      puntajePrincipal: r.puntuacion,
      puntajeSecundario: r.lineas_completadas,
      extra: `Nivel ${r.nivel_alcanzado}`,
      fecha: r.created_at,
      esPropio: r.user_id === this.userId
    }));
  }

  private async cargarAhorcado(): Promise<void> {
    const { data } = await this.authService.client
      .from('partidas')
      .select('user_id, resultado, letras_seleccionadas, tiempo_segundos, created_at, usuarios(nombre, apellido)')
      .order('tiempo_segundos', { ascending: true })
      .limit(50);

    // Ordenar: primero los que ganaron, luego por menos letras usadas
    const ganadores = (data || []).filter((r: any) => r.resultado === 'ganó');
    const perdedores = (data || []).filter((r: any) => r.resultado !== 'ganó');
    const ordenado = [
      ...ganadores.sort((a: any, b: any) => a.letras_seleccionadas - b.letras_seleccionadas),
      ...perdedores
    ];

    this.rankingAhorcado = ordenado.map((r: any, i: number) => ({
      posicion: i + 1,
      nombre: `${r.usuarios?.nombre ?? 'Anónimo'} ${r.usuarios?.apellido ?? ''}`.trim(),
      puntajePrincipal: r.letras_seleccionadas,
      puntajeSecundario: r.tiempo_segundos,
      extra: r.resultado === 'ganó' ? '✓ Ganó' : '✗ Perdió',
      fecha: r.created_at,
      esPropio: r.user_id === this.userId
    }));
  }

  private async cargarMayorMenor(): Promise<void> {
    const { data } = await this.authService.client
      .from('partidas_mayor_menor')
      .select('user_id, cartas_acertadas, cartas_totales, resultado, tiempo_segundos, created_at, usuarios(nombre, apellido)')
      .order('cartas_acertadas', { ascending: false })
      .limit(50);

    this.rankingMayorMenor = (data || []).map((r: any, i: number) => ({
      posicion: i + 1,
      nombre: `${r.usuarios?.nombre ?? 'Anónimo'} ${r.usuarios?.apellido ?? ''}`.trim(),
      puntajePrincipal: r.cartas_acertadas,
      puntajeSecundario: r.cartas_totales,
      extra: `${Math.round((r.cartas_acertadas / r.cartas_totales) * 100)}% precisión`,
      fecha: r.created_at,
      esPropio: r.user_id === this.userId
    }));
  }

  private async cargarPreguntados(): Promise<void> {
    const { data } = await this.authService.client
      .from('partidas_preguntados')
      .select('user_id, respuestas_correctas, respuestas_totales, tiempo_segundos, created_at, usuarios(nombre, apellido)')
      .order('respuestas_correctas', { ascending: false })
      .limit(50);

    this.rankingPreguntados = (data || []).map((r: any, i: number) => ({
      posicion: i + 1,
      nombre: `${r.usuarios?.nombre ?? 'Anónimo'} ${r.usuarios?.apellido ?? ''}`.trim(),
      puntajePrincipal: r.respuestas_correctas,
      puntajeSecundario: r.tiempo_segundos,
      extra: `${Math.round((r.respuestas_correctas / r.respuestas_totales) * 100)}% precisión`,
      fecha: r.created_at,
      esPropio: r.user_id === this.userId
    }));
  }

  setTab(tab: 'ahorcado' | 'mayor-menor' | 'preguntados' | 'tetris'): void {
    this.tabActiva = tab;
  }

  get rankingActivo(): FilaResultado[] {
    switch (this.tabActiva) {
      case 'tetris':      return this.rankingTetris;
      case 'ahorcado':    return this.rankingAhorcado;
      case 'mayor-menor': return this.rankingMayorMenor;
      case 'preguntados': return this.rankingPreguntados;
    }
  }

  get columnasActivas(): { principal: string; secundaria: string; extra: string } {
    switch (this.tabActiva) {
      case 'tetris':      return { principal: 'Puntuación', secundaria: 'Líneas', extra: 'Nivel' };
      case 'ahorcado':    return { principal: 'Letras usadas', secundaria: 'Tiempo (s)', extra: 'Resultado' };
      case 'mayor-menor': return { principal: 'Aciertos', secundaria: 'Jugadas', extra: 'Precisión' };
      case 'preguntados': return { principal: 'Correctas', secundaria: 'Tiempo (s)', extra: 'Precisión' };
    }
  }

  getMedalla(pos: number): string {
    if (pos === 1) return '🥇';
    if (pos === 2) return '🥈';
    if (pos === 3) return '🥉';
    return `${pos}`;
  }
}