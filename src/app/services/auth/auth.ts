import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BehaviorSubject, from, Observable, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { UsuarioSesion } from '../../models/usuario.model';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient = createClient('https://bscfusqgtnusravgrmyf.supabase.co', 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzY2Z1c3FndG51c3JhdmdybXlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNjQzMTQsImV4cCI6MjA5NDc0MDMxNH0.iNZ36fzmhpJfskGrsRXTUyEXeV49Ig8PoZAXxhGa1Ds');


  // register
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
           
            if (dbResponse.error) return throwError(() => dbResponse.error);
            
           
            return from([authResponse.data]);
          })
        );
      })
    );
  }

  // iniciar sesion

  iniciarSesion(credenciales: any): Observable<any> {
    const { email, password } = credenciales;

    return from(this.supabase.auth.signInWithPassword({ email, password })).pipe(
      switchMap((authResponse) => {

        if (authResponse.error) {
          return throwError(() => authResponse.error);
        }
      
        return from([authResponse.data]);
      })
    );
  }

  // mostrar usuario logeado
  private usuarioLogueado$ = new BehaviorSubject<UsuarioSesion | null>(null);

  get session$(): Observable<UsuarioSesion | null> {
    return this.usuarioLogueado$.asObservable();
  }

  actualizarUsuarioDesdeSupabase(supabaseUser: any) {
    if (supabaseUser) {
      this.usuarioLogueado$.next({
        nombre: supabaseUser.user_metadata?.['nombre'] || supabaseUser.email.split('@')[0],
        email: supabaseUser.email
      });
    } else {
      this.usuarioLogueado$.next(null);
    }
  }

  async cerrarSesion(): Promise<void>{
    await this.supabase.auth.signOut();
    this.usuarioLogueado$.next(null); 
  }

  async getUserId(): Promise<string | null> {
  const { data } = await this.supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

get estaLogueado(): boolean {
  return this.usuarioLogueado$.getValue() !== null;
}

get client() {
  return this.supabase;
}

}