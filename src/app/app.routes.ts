import { Routes } from '@angular/router';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
    {
        path: 'home',
        loadComponent: () => import('./pages/home/home').then((m) => m.HomeComponent)
    },
    {
        path: 'quien-soy',
        loadComponent: () => import('./pages/quiensoy/quiensoy').then((m) => m.QuiensoyComponent)
    },
    {
        path: 'login',
        loadComponent: () => import('./pages/login/login').then((m) => m.LoginComponent)
    },
    {
        path: 'registro',
        loadComponent: () => import('./pages/registro/registro').then((m) => m.RegistroComponent)
    },
    {
        path: 'resultados',
        loadComponent: () => import('./pages/resultados/resultados/resultados').then((m) => m.ResultadosComponent)
    },
    {
        path: 'juego-ahorcado',
        loadComponent: () => import('./pages/juegos/juego-ahorcado/juego-ahorcado').then((m) => m.AhorcadoComponent)
    },
    {
        path: 'juego-mayor-menor',
        loadComponent: () => import('./pages/juegos/juego-mayor-menor/juego-mayor-menor').then((m) => m.MayorMenorComponent)
    },
    {
        path: 'juego-preguntados',
        loadComponent: () => import('./pages/juegos/juego-preguntados/juego-preguntados/juego-preguntados').then((m) => m.PreguntadosComponent)
    },
    {
        path: 'juego-propio',
        loadComponent: () => import('./pages/juegos/juego-propio/juego-propio/juego-propio').then((m) => m.JuegoPropioComponent)
    },
    {
        path: 'encuesta',
        loadComponent: () => import('./pages/encuesta/encuesta/encuesta').then((m) => m.EncuestaComponent)
    },
    {
        path: 'resultado-encuestas',
        loadComponent: () => import('./pages/resultado-encuestas/resultado-encuestas/resultado-encuestas').then((m) => m.ResultadosEncuestaComponent)
    },
    {
        path: '',
        loadComponent: () => import('./pages/registro/registro').then((m) => m.RegistroComponent)
    },
    {
        path: '**',
        loadComponent: () => import('./pages/home/home').then((m) => m.HomeComponent)
    },
];
