import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { GithubService, PerfilSimplificado } from '../../services/github/github'; 

@Component({
  selector: 'app-quiensoy',
  standalone: true,
  templateUrl: './quiensoy.html',
  styleUrls: ['./quiensoy.css']
})
export class QuiensoyComponent implements OnInit {
  username: string = 'Franconicovicente'; 
  perfil: PerfilSimplificado | null = null;
  cargando: boolean = true;
  error: string | null = null;

  constructor(private githubService: GithubService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.githubService.obtenerPerfil(this.username).subscribe({
      next: (data) => {
        this.perfil = data; 
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'No se pudieron cargar los datos del alumno.';
        this.cargando = false;
        console.error(err);
        this.cdr.detectChanges();
      }
    });
  }
}