import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-quiensoy',
  standalone: true, // <-- Esto lo hace un componente moderno y autónomo
  imports: [], // <-- Al usar el nuevo flujo (@if), ya no necesitás importar CommonModule acá
  templateUrl: './quiensoy.html',
  styleUrls: ['./quiensoy.css']
})
export class QuiensoyComponent implements OnInit {
  perfil: any = null;
  cargando: boolean = true;
  error: string | null = null;
  username: string = 'Franconicovicente'; 

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get(`https://api.github.com/users/${this.username}`)
      .subscribe({
        next: (data) => {
          this.perfil = data;
          this.cargando = false;
        },
        error: (err) => {
          this.error = 'No se pudieron cargar los datos del alumno.';
          this.cargando = false;
          console.error(err);
        }
      });
  }
}