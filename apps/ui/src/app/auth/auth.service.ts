import {Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {BehaviorSubject, Observable, tap, throwError} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {User} from '../users/User.interface';
import {jwtDecode} from 'jwt-decode';
import {Router} from '@angular/router';

@Injectable({providedIn: 'root'})
export class AuthService {
  private authApiUrl = `${environment.apiBaseUrl}/auth`;

  private accessTokenKey = 'access_token';
  private refreshTokenKey = 'refresh_token';

  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    const token = localStorage.getItem(this.accessTokenKey);
    if (token) {
      try {
        const user: User = jwtDecode(token);
        this.userSubject.next(user);
      } catch (e) {
        this.logout();
      }
    }
  }

  login(email: string, pass: string): Observable<{ access_token: string; refresh_token: string }> {
    return this.http.post<{ access_token: string; refresh_token: string }>(`${this.authApiUrl}/login`, {
      email,
      pass
    }).pipe(
      tap(tokens => {
        this.setAccessToken(tokens.access_token);
        this.setRefreshToken(tokens.refresh_token);
      })
    );
  }

  loginWithGoogle() {
    window.location.href = `${this.authApiUrl}/google`;
  }

  setAccessToken(accessToken: string) {
    localStorage.setItem(this.accessTokenKey, accessToken);
    const user: User = jwtDecode(accessToken);
    setTimeout(() => {
      this.userSubject.next(user);
    });
  }

  setRefreshToken(refreshToken: string) {
    localStorage.setItem(this.refreshTokenKey, refreshToken);
  }

  refreshToken(): Observable<{ access_token: string; refresh_token: string }> {

    const refreshToken = localStorage.getItem(this.refreshTokenKey);
    if (refreshToken && this.isTokenExpired(refreshToken)) {
      this.logout();
      this.router.navigate(['/login']);
      return throwError(() => new Error('Refresh token expired'));
    }

    return this.http.post<{ access_token: string; refresh_token: string }>(`${this.authApiUrl}/refresh`, {'refresh': refreshToken});
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.accessTokenKey);
  }

  logout() {
    localStorage.clear();
    this.userSubject.next(null);
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }

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
