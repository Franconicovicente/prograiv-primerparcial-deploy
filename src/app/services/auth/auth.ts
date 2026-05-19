import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root' 
})
export class AuthService {
  private http = inject(HttpClient); 
  private apiUrl = 'http://localhost:4200/api'; 

  registrarUsuario(usuario: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, usuario);
  }
}