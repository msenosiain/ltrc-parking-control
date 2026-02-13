import {Component, DestroyRef, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {AuthService} from '../../auth.service';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {map} from 'rxjs';
import {jwtDecode} from 'jwt-decode';

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
        if (token) {
          this.authService.setAccessToken(token.access_token);
          this.authService.setRefreshToken(token.refresh_token);
          this.router.navigate(['/dashboard']);
        } else {
          this.authService.loginWithGoogle();
        }
      }
    );
  }

}
