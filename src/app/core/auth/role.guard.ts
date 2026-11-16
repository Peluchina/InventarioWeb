import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowedRoles = route.data['roles'] as readonly string[] | undefined;

  return auth.getCurrentUser().pipe(map((user) => {
    if (!user) return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    if (auth.hasRole('ADMINISTRADOR') || !allowedRoles?.length || auth.hasAnyRole(allowedRoles)) return true;
    return router.createUrlTree(['/inicio']);
  }));
};
