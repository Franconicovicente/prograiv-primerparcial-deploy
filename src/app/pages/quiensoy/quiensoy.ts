import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; 
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-quiensoy',
  standalone: true, 
  imports: [], 
  templateUrl: './quiensoy.html',
  styleUrls: ['./quiensoy.css']
})
export class QuiensoyComponent implements OnInit {
  perfil: any = null;
  cargando: boolean = true;
  error: string | null = null;
  username: string = 'Franconicovicente'; 


  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.http.get(`https://api.github.com/users/${this.username}`)
      .subscribe({
        next: (data) => {
          this.perfil = data;
          this.cargando = false;
          this.cdr.detectChanges(); // Fuerza a Angular a refrescar el HTML con la data de la caché
        },
        error: (err) => {
          this.error = 'No se pudieron cargar los datos del alumno.';
          this.cargando = false;
          this.cdr.detectChanges(); // También acá por las dudas si falla
          console.error(err);
        }
      });
  }
}