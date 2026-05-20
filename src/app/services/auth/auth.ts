import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { from, Observable, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient = createClient('https://bscfusqgtnusravgrmyf.supabase.co', 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzY2Z1c3FndG51c3JhdmdybXlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNjQzMTQsImV4cCI6MjA5NDc0MDMxNH0.iNZ36fzmhpJfskGrsRXTUyEXeV49Ig8PoZAXxhGa1Ds');

  registrarUsuario(datosRegistro: any): Observable<any> {
    const { email, password, nombre, apellido, edad } = datosRegistro;

    return from(this.supabase.auth.signUp({ email, password })).pipe(
      switchMap((authResponse) => {
        if (authResponse.error) return throwError(() => authResponse.error);

        const userUid = authResponse.data.user?.id;
        if (!userUid) return throwError(() => new Error('No se generó el ID de usuario.'));

        return from(
          this.supabase
            .from('usuarios')
            .insert([
              {
                id: userUid,        
                email: email,       
                nombre: nombre,     
                apellido: apellido, 
                edad: edad          
                
              }
            ])
        ).pipe(
          switchMap((dbResponse) => {
            // Si hay error
            if (dbResponse.error) return throwError(() => dbResponse.error);
            
            // Si salio bien, auth validado
            return from([authResponse.data]);
          })
        );
      })
    );
  }

  iniciarSesion(credenciales: any): Observable<any> {
    const { email, password } = credenciales;

    return from(this.supabase.auth.signInWithPassword({ email, password })).pipe(
      switchMap((authResponse) => {
        // Si las credenciales están mal o el mail no existe, Supabase devuelve un error
        if (authResponse.error) {
          return throwError(() => authResponse.error);
        }
        // Si todo está ok, devuelve la data del usuario y token
        return from([authResponse.data]);
      })
    );
  }


}