import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/role.guard';

export const PROVEEDORES_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/proveedores-list/proveedores-list.component').then((m) => m.ProveedoresListComponent), title: 'Proveedores | Stockwise' },
  { path: 'nuevo', loadComponent: () => import('./pages/proveedor-create/proveedor-create.component').then((m) => m.ProveedorCreateComponent), canActivate: [roleGuard], data: { roles: ['ADMINISTRADOR'] }, title: 'Nuevo proveedor | Stockwise' },
  { path: 'editar/:id', loadComponent: () => import('./pages/proveedor-edit/proveedor-edit.component').then((m) => m.ProveedorEditComponent), canActivate: [roleGuard], data: { roles: ['ADMINISTRADOR'] }, title: 'Editar proveedor | Stockwise' },
];
