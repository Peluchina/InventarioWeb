import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/role.guard';

export const USUARIOS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/usuarios-list/usuarios-list.component').then((m) => m.UsuariosListComponent), title: 'Usuarios | Stockwise' },
  { path: 'nuevo', loadComponent: () => import('./pages/usuario-create/usuario-create.component').then((m) => m.UsuarioCreateComponent), canActivate: [roleGuard], data: { roles: ['ADMINISTRADOR'] }, title: 'Nuevo usuario | Stockwise' },
  { path: 'editar/:id', loadComponent: () => import('./pages/usuario-edit/usuario-edit.component').then((m) => m.UsuarioEditComponent), canActivate: [roleGuard], data: { roles: ['ADMINISTRADOR'] }, title: 'Editar usuario | Stockwise' },
];
