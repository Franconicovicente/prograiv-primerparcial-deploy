import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { EncuestaService } from '../../../services/encuesta/encuesta';
import { EncuestaResultado } from '../../../models/encuesta.model';
import { SlicePipe } from '@angular/common';

@Component({
  selector: 'app-resultados-encuesta',
  standalone: true,
  imports: [RouterLink, SlicePipe],
  templateUrl: './resultado-encuestas.html',
  styleUrls: ['./resultado-encuestas.css'],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(24px)' }),
        animate('400ms ease', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('staggerRows', [
      transition(':enter', [
        query('.row-animated', [
          style({ opacity: 0, transform: 'translateX(-16px)' }),
          stagger(60, [
            animate('300ms ease', style({ opacity: 1, transform: 'translateX(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class ResultadosEncuestaComponent implements OnInit {
  private encuestaService = inject(EncuestaService);

  cargando = signal(true);
  encuestas = signal<EncuestaResultado[]>([]);
  error = signal<string | null>(null);
  expandida = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      const data = await this.encuestaService.getResultados();
      this.encuestas.set(data);
    } catch (err) {
      this.error.set('No se pudieron cargar los resultados.');
    } finally {
      this.cargando.set(false);
    }
  }

  toggleExpandir(id: string): void {
    this.expandida.set(this.expandida() === id ? null : id);
  }

  estaExpandida(id: string): boolean {
    return this.expandida() === id;
  }
}