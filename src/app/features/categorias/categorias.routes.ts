import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/role.guard';

export const CATEGORIAS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/categorias-list/categorias-list.component').then((m) => m.CategoriasListComponent),
    title: 'Categorías | Stockwise',
  },
  {
    path: 'nuevo',
    loadComponent: () => import('./pages/categoria-create/categoria-create.component').then((m) => m.CategoriaCreateComponent),
    canActivate: [roleGuard],
    data: { roles: ['ADMINISTRADOR'] },
    title: 'Nueva categoría | Stockwise',
  },
  {
    path: 'editar/:id',
    loadComponent: () => import('./pages/categoria-edit/categoria-edit.component').then((m) => m.CategoriaEditComponent),
    canActivate: [roleGuard],
    data: { roles: ['ADMINISTRADOR'] },
    title: 'Editar categoría | Stockwise',
  },
];
