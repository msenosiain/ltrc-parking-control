import {HttpErrorResponse, HttpHandlerFn, HttpRequest} from '@angular/common/http';
import {inject} from '@angular/core';
import {AuthService} from './auth.service';
import {catchError, switchMap, throwError} from 'rxjs';
import {Router} from '@angular/router';

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  // Inject the current `AuthService` and use it to get an authentication token:
  const authService: AuthService = inject(AuthService);
  const router: Router = inject(Router);
  const accessToken = authService.getAccessToken();

  // Only add the Authorization header if we have a valid token
  let cloned = req;
  if (accessToken) {
    cloned = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${accessToken}`),
    });
  }

  return next(cloned).pipe(
    catchError((err) => {
      // Only try to refresh token if we had a token to begin with
      if (err instanceof HttpErrorResponse && err.status === 401 && accessToken) {
        return authService.refreshToken().pipe(
          switchMap((tokens) => {
            authService.setAccessToken(tokens.access_token);
            const newReq = req.clone({
              headers: req.headers.set('Authorization', `Bearer ${tokens.access_token}`),
            });
            return next(newReq);
          }),
          catchError((error) => {
            authService.logout();
            router.navigate(['/']);
            return throwError(() => error);
          })
        );
      }
      return throwError(() => err);
    })
  );
}
