import { Routes } from '@angular/router';

export const MOVIMIENTOS_INVENTARIO_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/movimientos-list/movimientos-list.component').then((m) => m.MovimientosListComponent), title: 'Movimientos | Stockwise' },
  { path: 'nuevo', loadComponent: () => import('./pages/movimiento-create/movimiento-create.component').then((m) => m.MovimientoCreateComponent), title: 'Registrar movimiento | Stockwise' },
  { path: 'producto/:productoId', loadComponent: () => import('./pages/movimientos-list/movimientos-list.component').then((m) => m.MovimientosListComponent), title: 'Historial de producto | Stockwise' },
  { path: ':id', loadComponent: () => import('./pages/movimiento-detail/movimiento-detail.component').then((m) => m.MovimientoDetailComponent), title: 'Detalle del movimiento | Stockwise' },
];
