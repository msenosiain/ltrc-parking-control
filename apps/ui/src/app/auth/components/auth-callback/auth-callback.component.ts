import {Component, DestroyRef, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {AuthService} from '../../auth.service';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {map} from 'rxjs';

@Component({
  selector: 'ltrc-auth-callback',
  imports: [CommonModule],
  templateUrl: './auth-callback.component.html',
  styleUrl: './auth-callback.component.scss'
})
export class AuthCallbackComponent implements OnInit {

  destroyRef = inject(DestroyRef);

  constructor(private route: ActivatedRoute, private authService: AuthService, private router: Router) {
  }

  ngOnInit(): void {
    this.route.queryParams.pipe(
      takeUntilDestroyed(this.destroyRef),
      map((params) => {
        return {access_token: params['access_token'], refresh_token: params['refresh_token']};
      })
    ).subscribe((token) => {
        const hasAccess = !!token?.access_token;
        const hasRefresh = !!token?.refresh_token;

        // If running inside a popup opened by loginWithGoogle(), send tokens via postMessage and close the popup.
        const isPopup = !!(window.opener && window.opener !== window && window.name === 'ltrc_oauth_google');

        if (isPopup && hasAccess && hasRefresh) {
          try {
            // Send tokens to opener and close
            window.opener.postMessage({ access_token: token.access_token, refresh_token: token.refresh_token }, '*');
          } catch {
            // ignore postMessage failures
          }
          try { window.close(); } catch {
            // ignore close failures
          }
          return;
        }

        // If we received both tokens in the main window, save them and continue to dashboard.
        if (hasAccess && hasRefresh) {
          this.authService.setAccessToken(token.access_token);
          this.authService.setRefreshToken(token.refresh_token);
          this.router.navigate(['/dashboard']);
          return;
        }

        // If neither token present, don't auto-retry to avoid redirect loops; go back to login and show an error.
        if (!hasAccess && !hasRefresh) {
          this.router.navigate(['/login'], { queryParams: { error: 'no_tokens' } });
          return;
        }

        // Partial or invalid result: navigate to login with an error message.
        this.router.navigate(['/login'], { queryParams: { error: 'authentication_failed' } });
      }
    );
  }

}
