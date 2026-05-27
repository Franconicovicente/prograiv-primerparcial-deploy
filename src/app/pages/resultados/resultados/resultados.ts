import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { SlicePipe } from '@angular/common';
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
  imports: [SlicePipe],
  templateUrl: './resultados.html',
  styleUrls: ['./resultados.css']
})
export class ResultadosComponent implements OnInit {
  private authService = inject(AuthService);

  cargando = signal<boolean>(true);
  tabActiva = signal<'ahorcado' | 'mayor-menor' | 'preguntados' | 'tetris'>('tetris');

  rankingTetris = signal<FilaResultado[]>([]);
  rankingAhorcado = signal<FilaResultado[]>([]);
  rankingMayorMenor = signal<FilaResultado[]>([]);
  rankingPreguntados = signal<FilaResultado[]>([]);

  private userId = '';

  rankingActivo = computed<FilaResultado[]>(() => {
    switch (this.tabActiva()) { // 👈 Leemos el signal usando ()
      case 'tetris':      return this.rankingTetris();
      case 'ahorcado':    return this.rankingAhorcado();
      case 'mayor-menor': return this.rankingMayorMenor();
      case 'preguntados': return this.rankingPreguntados();
    }
  });

  columnasActivas = computed<{ principal: string; secundaria: string; extra: string }>(() => {
    switch (this.tabActiva()) {
      case 'tetris':      return { principal: 'Puntuación', secundaria: 'Líneas', extra: 'Nivel' };
      case 'ahorcado':    return { principal: 'Letras usadas', secundaria: 'Tiempo (s)', extra: 'Resultado' };
      case 'mayor-menor': return { principal: 'Aciertos', secundaria: 'Jugadas', extra: 'Precisión' };
      case 'preguntados': return { principal: 'Correctas', secundaria: 'Tiempo (s)', extra: 'Precisión' };
    }
  });

  async ngOnInit(): Promise<void> {
    this.userId = (await this.authService.getUserId()) ?? '';
    await this.cargarTodos();
    this.cargando.set(false);
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

    const mapeado = (data || []).map((r: any, i: number) => ({
      posicion: i + 1,
      nombre: `${r.usuarios?.nombre ?? 'Anónimo'} ${r.usuarios?.apellido ?? ''}`.trim(),
      puntajePrincipal: r.puntuacion,
      puntajeSecundario: r.lineas_completadas,
      extra: `Nivel ${r.nivel_alcanzado}`,
      fecha: r.created_at,
      esPropio: r.user_id === this.userId
    }));

    this.rankingTetris.set(mapeado); 
  }

  private async cargarAhorcado(): Promise<void> {
    const { data } = await this.authService.client
      .from('partidas')
      .select('user_id, resultado, letras_seleccionadas, tiempo_segundos, created_at, usuarios(nombre, apellido)')
      .order('tiempo_segundos', { ascending: true })
      .limit(50);

    const ganadores = (data || []).filter((r: any) => r.resultado === 'ganó');
    const perdedores = (data || []).filter((r: any) => r.resultado !== 'ganó');
    const ordenado = [
      ...ganadores.sort((a: any, b: any) => a.letras_seleccionadas - b.letras_seleccionadas),
      ...perdedores
    ];

    const mapeado = ordenado.map((r: any, i: number) => ({
      posicion: i + 1,
      nombre: `${r.usuarios?.nombre ?? 'Anónimo'} ${r.usuarios?.apellido ?? ''}`.trim(),
      puntajePrincipal: r.letras_seleccionadas,
      puntajeSecundario: r.tiempo_segundos,
      extra: r.resultado === 'ganó' ? '✓ Ganó' : '✗ Perdió',
      fecha: r.created_at,
      esPropio: r.user_id === this.userId
    }));

    this.rankingAhorcado.set(mapeado); 
  }

  private async cargarMayorMenor(): Promise<void> {
    const { data } = await this.authService.client
      .from('partidas_mayor_menor')
      .select('user_id, cartas_acertadas, cartas_totales, resultado, tiempo_segundos, created_at, usuarios(nombre, apellido)')
      .order('cartas_acertadas', { ascending: false })
      .limit(50);

    const mapeado = (data || []).map((r: any, i: number) => ({
      posicion: i + 1,
      nombre: `${r.usuarios?.nombre ?? 'Anónimo'} ${r.usuarios?.apellido ?? ''}`.trim(),
      puntajePrincipal: r.cartas_acertadas,
      puntajeSecundario: r.cartas_totales,
      extra: `${Math.round((r.cartas_acertadas / r.cartas_totales) * 100)}% precisión`,
      fecha: r.created_at,
      esPropio: r.user_id === this.userId
    }));

    this.rankingMayorMenor.set(mapeado); 
  }

  private async cargarPreguntados(): Promise<void> {
    const { data } = await this.authService.client
      .from('partidas_preguntados')
      .select('user_id, respuestas_correctas, respuestas_totales, tiempo_segundos, created_at, usuarios(nombre, apellido)')
      .order('respuestas_correctas', { ascending: false })
      .limit(50);

    const mapeado = (data || []).map((r: any, i: number) => ({
      posicion: i + 1,
      nombre: `${r.usuarios?.nombre ?? 'Anónimo'} ${r.usuarios?.apellido ?? ''}`.trim(),
      puntajePrincipal: r.respuestas_correctas,
      puntajeSecundario: r.tiempo_segundos,
      extra: `${Math.round((r.respuestas_correctas / r.respuestas_totales) * 100)}% precisión`,
      fecha: r.created_at,
      esPropio: r.user_id === this.userId
    }));

    this.rankingPreguntados.set(mapeado); 
  }

  setTab(tab: 'ahorcado' | 'mayor-menor' | 'preguntados' | 'tetris'): void {
    this.tabActiva.set(tab); 
  }

  getMedalla(pos: number): string {
    if (pos === 1) return '🥇';
    if (pos === 2) return '🥈';
    if (pos === 3) return '🥉';
    return `${pos}`;
  }
}