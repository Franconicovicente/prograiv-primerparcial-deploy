import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-registro',
  standalone: true, // ◄ Clave en Angular moderno
  imports: [ReactiveFormsModule, RouterLink], // ◄ Importamos lo que el HTML necesita
  templateUrl: './registro.html',
  styleUrls: ['./registro.css']
})
export class RegistroComponent implements OnInit {
  // Inyecciones modernas con inject()
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registroForm!: FormGroup;

  ngOnInit(): void {
    this.registroForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      edad: ['', [Validators.required, Validators.min(1)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.registroForm.valid) {
      this.authService.registrarUsuario(this.registroForm.value).subscribe({
        next: (res) => {
          alert('¡Registrado con éxito bro!');
          this.router.navigate(['/login']); 
        },
        error: (err) => {
          console.error(err);
          alert('Error al registrar: ' + err.error.error);
        }
      });
    }
  }
}