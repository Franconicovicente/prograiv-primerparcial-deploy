import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router'; 
import { CommonModule } from '@angular/common'; 
import { GithubService } from './services/github/github'; 
import { AuthService, } from './services/auth/auth';
import { UsuarioSesion } from './models/usuario.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './app.html', 
  styleUrls: ['./app.css']   
})
export class AppComponent implements OnInit {
  title = 'TETRA';
  usuario: UsuarioSesion | null = null; 
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  async ngOnInit(): Promise<void> {
    this.authService.session$.subscribe(user => {
      this.usuario = user;
      this.cdr.detectChanges();
    });
    const { data } = await this.authService.client.auth.getSession();
      if (data.session?.user) {
      this.authService.actualizarUsuarioDesdeSupabase(data.session.user);
    } 
  }

  async onCerrarSesion(): Promise<void> {
    await this.authService.cerrarSesion();
  }
}