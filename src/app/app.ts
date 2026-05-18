import { Component } from '@angular/core';
// 1. Importamos los dos módulos necesarios para las rutas
import { RouterOutlet, RouterLink } from '@angular/router'; 

@Component({
  selector: 'app-root',
  standalone: true,
  // 2. Clave: agregamos RouterLink acá para que el HTML entienda el atributo routerLink
  imports: [RouterOutlet, RouterLink], 
  templateUrl: './app.html', // O './app.component.html' según cómo lo tengas nombrado
  styleUrls: ['./app.css']   // O './app.component.css'
})
export class AppComponent {
  title = 'tu-proyecto';
}