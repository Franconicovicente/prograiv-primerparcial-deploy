import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { from, Observable, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Poné tus credenciales reales acá si no las tenías puestas
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
            // Si falla la inserción en la tabla pública por las políticas o datos
            if (dbResponse.error) return throwError(() => dbResponse.error);
            
            // Si todo salió joya, retornamos la data del auth exitoso
            return from([authResponse.data]);
          })
        );
      })
    );
  }

  iniciarSesion(credenciales: any): Observable<any> {
    const { email, password } = credenciales;

    // Le pegamos directo a la autenticación de Supabase
    return from(this.supabase.auth.signInWithPassword({ email, password })).pipe(
      switchMap((authResponse) => {
        // Si las credenciales están mal o el mail no existe, Supabase devuelve un error
        if (authResponse.error) {
          return throwError(() => authResponse.error);
        }
        // Si todo está ok, devolvemos la data del usuario y token
        return from([authResponse.data]);
      })
    );
  }


}