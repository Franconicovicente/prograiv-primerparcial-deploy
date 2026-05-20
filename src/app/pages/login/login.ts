import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth/auth';
import { NgIf } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgIf],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm!: FormGroup;
  showPassword = false;

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }


  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.authService.iniciarSesion(this.loginForm.value).subscribe({
        next: (res) => {
          this.authService.actualizarUsuarioDesdeSupabase(res.user || res);
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: `¡Bienvenido!`,
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
          });

          this.loginForm.reset();
          
          this.router.navigate(['/home']); 
        },
        error: () => {
          Swal.fire({
            title: 'Error de ingreso',
            text:'Credenciales incorrectas.',
            icon: 'error',
            confirmButtonColor: '#d33',
            confirmButtonText: 'Reintentar'
          });
        }
      });
    }
  }
}