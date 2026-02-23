import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable, tap, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { User } from '../users/User.interface';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Minimal base URL handling: remove trailing slash if present
  private apiBase = (environment.apiBaseUrl || '/api/v1').replace(/\/+$/g, '');
  private authApi = `${this.apiBase}/auth`;

  private accessTokenKey = environment.accessTokenKey || 'access_token';
  private refreshTokenKey = environment.refreshTokenKey || 'refresh_token';

  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    const token = localStorage.getItem(this.accessTokenKey);
    if (token) {
      try {
        const user: User = jwtDecode(token);
        this.userSubject.next(user);
      } catch {
        // ignore invalid token
      }
    }
  }

  /**
   * Traditional username/password login.
   */
  login(email: string, pass: string): Observable<{ access_token: string; refresh_token: string }> {
    return this.http.post<{ access_token: string; refresh_token: string }>(`${this.authApi}/login`, { email, pass }).pipe(
      tap(tokens => {
        this.setAccessToken(tokens.access_token);
        this.setRefreshToken(tokens.refresh_token);
      })
    );
  }

  /**
   * Start Google OAuth by navigating the main window to the backend endpoint.
   */
  loginWithGoogle(): void {
    const href = `${this.apiBase}/auth/google`;
    window.location.href = href;
  }

  /**
   * Store access token and update user observable.
   */
  setAccessToken(accessToken: string): void {
    try {
      localStorage.setItem(this.accessTokenKey, accessToken);
      const user: User = jwtDecode(accessToken);
      // update observable asynchronously
      setTimeout(() => this.userSubject.next(user));
    } catch {
      // ignore storage/decoding errors
    }
  }

  /**
   * Store refresh token.
   */
  setRefreshToken(refreshToken: string): void {
    try {
      localStorage.setItem(this.refreshTokenKey, refreshToken);
    } catch {
      // ignore storage errors
    }
  }

  /**
   * Refresh tokens using the backend.
   */
  refreshToken(): Observable<{ access_token: string; refresh_token: string }> {
    const refreshToken = localStorage.getItem(this.refreshTokenKey);
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token'));
    }
    return this.http.post<{ access_token: string; refresh_token: string }>(`${this.authApi}/refresh`, { refresh: refreshToken }).pipe(
      tap(tokens => {
        this.setAccessToken(tokens.access_token);
        this.setRefreshToken(tokens.refresh_token);
      })
    );
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.accessTokenKey);
  }

  logout(): void {
    try {
      localStorage.removeItem(this.accessTokenKey);
      localStorage.removeItem(this.refreshTokenKey);
    } catch {
      // ignore
    }
    this.userSubject.next(null);
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Check token expiry quickly.
   */
  private isTokenExpired(token: string): boolean {
    try {
      const decoded = jwtDecode<{ exp: number }>(token);
      const exp = decoded.exp;
      const now = Math.floor(Date.now() / 1000);
      return exp < now;
    } catch {
      return true;
    }
  }
}
