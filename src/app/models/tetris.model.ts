export interface Celda {
  tipo: number;
  ghost: boolean;
}

export interface Pieza {
  forma: number[][];
  x: number;
  y: number;
  tipo: number;
}