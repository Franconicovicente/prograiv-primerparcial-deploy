import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { AuthService } from '../../../services/auth/auth';
import { EncuestaService } from '../../../services/encuesta/encuesta';

const GENEROS = ['Acción', 'Estrategia', 'Puzzle', 'Deportes', 'RPG', 'Terror'];

function soloNumeros(control: AbstractControl) {
  return /^\d+$/.test(control.value) ? null : { soloNumeros: true };
}

@Component({
  selector: 'app-encuesta',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './encuesta.html',
  styleUrls: ['./encuesta.css'],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(24px)' }),
        animate('400ms ease', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('staggerFields', [
      transition(':enter', [
        query('.field-animated', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(80, [
            animate('350ms ease', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate('300ms ease', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ])
  ]
})
export class EncuestaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private encuestaService = inject(EncuestaService);
  private router = inject(Router);

  form!: FormGroup;
  enviando = signal(false);
  yaRespondio = signal(false);
  enviado = signal(false);
  error = signal<string | null>(null);

  readonly generos = GENEROS;
  private userId = '';

  async ngOnInit(): Promise<void> {
    this.userId = (await this.authService.getUserId()) ?? '';

    if (!this.userId) {
      this.router.navigate(['/login']);
      return;
    }

    const respondio = await this.encuestaService.yaRespondio(this.userId);
    this.yaRespondio.set(respondio);

    this.form = this.fb.group({
      nombre:           ['', [Validators.required, Validators.minLength(2)]],
      apellido:         ['', [Validators.required, Validators.minLength(2)]],
      edad:             ['', [Validators.required, Validators.min(18), Validators.max(99)]],
      telefono:         ['', [Validators.required, Validators.maxLength(10), soloNumeros]],
      frecuencia_juego: ['', Validators.required],
      generos:          this.fb.group(
        Object.fromEntries(GENEROS.map(g => [g, false]))
      ),
      recomienda:       ['', Validators.required],
    });
  }

  get generosSeleccionados(): string[] {
    const vals = this.form.get('generos')?.value ?? {};
    return GENEROS.filter(g => vals[g]);
  }

  isInvalid(campo: string): boolean {
    const c = this.form.get(campo);
    return !!(c?.invalid && c?.touched);
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.generosSeleccionados.length === 0) {
      this.error.set('Seleccioná al menos un género.');
      return;
    }

    this.enviando.set(true);
    this.error.set(null);

    try {
      await this.encuestaService.guardarEncuesta({
        user_id: this.userId,
        nombre: this.form.value.nombre,
        apellido: this.form.value.apellido,
        edad: Number(this.form.value.edad),
        telefono: this.form.value.telefono,
        frecuencia_juego: this.form.value.frecuencia_juego,
        genero_preferido: this.generosSeleccionados,
        recomienda: this.form.value.recomienda,
      });
      this.enviado.set(true);
    } catch (err: any) {
      this.error.set('Error al enviar la encuesta. Intentá de nuevo.');
    } finally {
      this.enviando.set(false);
    }
  }
}