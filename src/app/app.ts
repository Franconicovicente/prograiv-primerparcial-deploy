import { Component, OnInit, ChangeDetectorRef, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router'; 
import { CommonModule } from '@angular/common'; 
import { AuthService, } from './services/auth/auth';
import { UsuarioSesion } from './models/usuario.model';
import { routeAnimations } from './animations/route.animations';
import { provideAnimations } from '@angular/platform-browser/animations';

@Component({
  selector: 'app-root',
  standalone: true,
  animations: [routeAnimations],
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './app.html', 
  styleUrls: ['./app.css']   
})
export class AppComponent implements OnInit {
  title = 'TETRA';
  usuario = signal<UsuarioSesion | null>(null);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  esAdmin = signal(false);


    async ngOnInit(): Promise<void> {
      this.authService.session$.subscribe(async user => {
      this.usuario.set(user);
      if (user) {
        const { data: usuario } = await this.authService.client
          .from('usuarios')
          .select('es_admin')
          .eq('id', (await this.authService.getUserId()) ?? '')
          .single();
        this.esAdmin.set(usuario?.es_admin ?? false);
      } else {
        this.esAdmin.set(false);
      }
    });

      const { data } = await this.authService.client.auth.getSession();
      if (data.session?.user) {
        this.authService.actualizarUsuarioDesdeSupabase(data.session.user);

        // Verificar si es admin
        const { data: usuario } = await this.authService.client
          .from('usuarios')
          .select('es_admin')
          .eq('id', data.session.user.id)
          .single();
        this.esAdmin.set(usuario?.es_admin ?? false);
      }
    }

    

  async onCerrarSesion(): Promise<void> {
    await this.authService.cerrarSesion();
  }
}