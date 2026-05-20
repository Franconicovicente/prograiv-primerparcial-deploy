import { Routes } from '@angular/router';

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
        path: 'juego-ahorcado',
        loadComponent: () => import('./pages/juegos/juego-ahorcado/juego-ahorcado').then((m) => m.AhorcadoComponent)
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
