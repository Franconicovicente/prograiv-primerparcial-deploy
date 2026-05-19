import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth/auth';
import { NgIf } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-registro',
  standalone: true, // ◄ Clave en Angular moderno
  imports: [ReactiveFormsModule, RouterLink, NgIf], 
  templateUrl: './registro.html',
  styleUrls: ['./registro.css']
})
export class RegistroComponent implements OnInit {
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
async onSubmit(): Promise<void> {
    if (this.registroForm.valid) {
      // 1. Sacamos los datos del formulario
      const { email, password, nombre, apellido, edad } = this.registroForm.value;

      try {
        this.authService.registrarUsuario({ email, password, nombre, apellido, edad }).subscribe({
          next: (res) => {
            Swal.fire({
            title: '¡Registrado con éxito bro!',
            text: 'Tu cuenta fue creada correctamente.',
            icon: 'success',
            confirmButtonColor: '#3085d6', 
            confirmButtonText: 'Ir al Login'
          }).then((result) => {
            if (result.isConfirmed) {
              this.registroForm.reset();
              this.router.navigate(['/login']); 
            }
          });; 
          },
          error: (err) => {
            Swal.fire({
            title: 'Error al registrar',
            text: 'Ocurrió un problema inesperado, intentalo de nuevo.',
            icon: 'error',
            confirmButtonColor: '#d33',
            confirmButtonText: 'Entendido'
          });
          }
        });

      } catch (error: any) {
        console.error('Error inesperado:', error);
        Swal.fire({
            title: 'Error al registrar',
            text: 'Ocurrió un problema inesperado, intentalo de nuevo.',
            icon: 'error',
            confirmButtonColor: '#d33',
            confirmButtonText: 'Entendido'
          });
      }
    }
  }
}