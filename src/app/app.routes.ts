import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/pages/login/login.component').then((m) => m.LoginComponent), title: 'Iniciar sesión | Stockwise' },
  {
    path: '',
    loadComponent: () => import('./layouts/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      { path: 'inicio', loadComponent: () => import('./features/home/pages/home/home.component').then((m) => m.HomeComponent), title: 'Inicio | Stockwise' },
      {
        path: 'proveedores',
        loadChildren: () => import('./features/proveedores/proveedores.routes').then((m) => m.PROVEEDORES_ROUTES),
      },
      {
        path: 'usuarios',
        loadChildren: () => import('./features/usuarios/usuarios.routes').then((m) => m.USUARIOS_ROUTES),
      },
      {
        path: 'productos',
        loadChildren: () => import('./features/productos/productos.routes').then((m) => m.PRODUCTOS_ROUTES),
      },
      {
        path: 'categorias',
        loadChildren: () => import('./features/categorias/categorias.routes').then((m) => m.CATEGORIAS_ROUTES),
      },
      {
        path: 'almacenes',
        loadChildren: () => import('./features/almacenes/almacenes.routes').then((m) => m.ALMACENES_ROUTES),
      },
      {
        path: 'movimientos-inventario',
        loadChildren: () => import('./features/movimientos-inventario/movimientos-inventario.routes').then((m) => m.MOVIMIENTOS_INVENTARIO_ROUTES),
      },
      { path: '**', redirectTo: 'inicio' },
    ],
  },
  { path: '**', redirectTo: 'inicio' },
];

