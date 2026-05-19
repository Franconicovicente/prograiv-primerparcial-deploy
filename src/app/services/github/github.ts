import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// 1. Definís la interfaz con SOLO lo que vas a usar
export interface PerfilSimplificado {
  name: string;
  avatar_url: string;
  bio: string;
  public_repos: number;
}

@Injectable({
  providedIn: 'root'
})
export class GithubService {
  private apiUrl = 'https://api.github.com/users';

  constructor(private http: HttpClient) {}

  // 2. El método recibe el username y retorna el Observable filtrado
  obtenerPerfil(username: string): Observable<PerfilSimplificado> {
    return this.http.get<any>(`${this.apiUrl}/${username}`).pipe(
      map(data => {
        // 3. Acá filtrás: armás el objeto solo con lo que te interesa
        return {
          name: data.name,
          avatar_url: data.avatar_url,
          bio: data.bio,
          public_repos: data.public_repos
        };
      })
    );
  }
}