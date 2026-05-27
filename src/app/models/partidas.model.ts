export interface Partida {
  user_id: string;
  palabra: string;
  resultado: 'ganó' | 'perdió';
  letras_seleccionadas: number;
  tiempo_segundos: number;
  errores: number;
}

export interface PartidaMayorMenor {
  user_id: string;
  cartas_acertadas: number;
  cartas_totales: number;
  resultado: 'ganó' | 'perdió';
  tiempo_segundos: number;
}

export interface PartidaPreguntados {
  user_id: string;
  respuestas_correctas: number;
  respuestas_totales: number;
  resultado: 'ganó' | 'perdió';
  tiempo_segundos: number;
}

export interface PartidaJuegoPropio {
  user_id: string;
  puntuacion: number;
  lineas_completadas: number;
  nivel_alcanzado: number;
}