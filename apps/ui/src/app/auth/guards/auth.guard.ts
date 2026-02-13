import {inject} from '@angular/core';
import {CanActivateFn} from '@angular/router';
import {AuthService} from '../auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);

  if (!authService.isLoggedIn()) {
    authService.loginWithGoogle();
    return false;
  }
  return authService.isLoggedIn();
};
