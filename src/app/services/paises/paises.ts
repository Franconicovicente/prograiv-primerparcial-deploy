import { Injectable, signal } from '@angular/core';
import { Pais } from '../../models/pais.model'

@Injectable({ providedIn: 'root' })
export class PaisesService {
  paises = signal<Pais[]>([]);
  cargando = signal<boolean>(false);

  async cargarPaises(): Promise<void> {
    if (this.paises().length > 0) return; 

    this.cargando.set(true);
    try {
      const res = await fetch('https://restcountries.com/v3.1/all?fields=cca2,name');
      const data = await res.json();
      const mapeados = data
        .map((p: any) => ({ code: p.cca2, name: p.name.common }))
        .filter((p: Pais) => p.code && p.name)
        .sort(() => Math.random() - 0.5);

      this.paises.set(mapeados);
    } catch (err) {
      console.error('Error cargando países:', err);
    } finally {
      this.cargando.set(false);
    }
  }
}