import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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

  obtenerPerfil(username: string): Observable<PerfilSimplificado> {
    return this.http.get<any>(`${this.apiUrl}/${username}`).pipe(
      map(data => {
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