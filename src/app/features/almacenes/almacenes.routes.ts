import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/role.guard';

export const ALMACENES_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/almacenes-list/almacenes-list.component').then((m) => m.AlmacenesListComponent), title: 'Almacenes | Stockwise' },
  { path: 'nuevo', loadComponent: () => import('./pages/almacen-create/almacen-create.component').then((m) => m.AlmacenCreateComponent), canActivate: [roleGuard], data: { roles: ['ADMINISTRADOR'] }, title: 'Nuevo almacén | Stockwise' },
  { path: 'editar/:id', loadComponent: () => import('./pages/almacen-edit/almacen-edit.component').then((m) => m.AlmacenEditComponent), canActivate: [roleGuard], data: { roles: ['ADMINISTRADOR'] }, title: 'Editar almacén | Stockwise' },
];
