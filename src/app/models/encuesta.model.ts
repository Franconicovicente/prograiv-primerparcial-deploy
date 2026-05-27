export interface Encuesta {
  user_id: string;
  nombre: string;
  apellido: string;
  edad: number;
  telefono: string;
  frecuencia_juego: string;
  genero_preferido: string[];
  recomienda: string;
}

export interface EncuestaResultado extends Encuesta {
  id: string;
  created_at: string;
}