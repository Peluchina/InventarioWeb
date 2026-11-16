import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/role.guard';

export const PRODUCTOS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/productos-list/productos-list.component').then((m) => m.ProductosListComponent), title: 'Productos | Stockwise' },
  { path: 'nuevo', loadComponent: () => import('./pages/producto-create/producto-create.component').then((m) => m.ProductoCreateComponent), canActivate: [roleGuard], data: { roles: ['ADMINISTRADOR'] }, title: 'Nuevo producto | Stockwise' },
  { path: 'editar/:id', loadComponent: () => import('./pages/producto-edit/producto-edit.component').then((m) => m.ProductoEditComponent), canActivate: [roleGuard], data: { roles: ['ADMINISTRADOR'] }, title: 'Editar producto | Stockwise' },
];
