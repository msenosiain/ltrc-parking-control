import {inject,} from '@angular/core';
import {CanActivateFn, Router,} from '@angular/router';
import {filter, map} from 'rxjs';
import {AuthService} from '../auth.service';
import {Role} from '../roles.enum';

export const hasRoleGuard: CanActivateFn = (route) => {
  const allowedRoles: Role[] = route.data?.['allowedRoles'];
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.user$.pipe(
    filter(user => !!user),
    map(user => {
      const allowed = allowedRoles.some(role => user.roles.includes(role))
      if (!allowed) {
        console.error(`User ${user.email} not allowed to /${route.url}`)
        router.navigate(['/dashboard']);
      }
      return allowed;
    })
  );
};
