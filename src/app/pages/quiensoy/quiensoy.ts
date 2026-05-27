import { Component, OnInit, signal } from '@angular/core'; 
import { GithubService } from '../../services/github/github';
import { PerfilSimplificado } from '../../models/github.model';

@Component({
  selector: 'app-quiensoy',
  standalone: true,
  templateUrl: './quiensoy.html',
  styleUrls: ['./quiensoy.css']
})
export class QuiensoyComponent implements OnInit {
  username = signal<string>('Franconicovicente'); 
  perfil = signal<PerfilSimplificado | null>(null);
  cargando = signal<boolean>(true);
  error = signal<string | null>(null);

  constructor(private githubService: GithubService) {}

  ngOnInit(): void {
    this.githubService.obtenerPerfil(this.username()).subscribe({
      next: (data) => {
        this.perfil.set(data); 
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set('No se pudieron cargar los datos del alumno.');
        this.cargando.set(false);
        console.error(err);
      }
    });
  }
}