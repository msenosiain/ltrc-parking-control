import {Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {MatSubheaderHarness} from '@angular/material/list/testing';
import {BehaviorSubject, Observable, throwError} from 'rxjs';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {User} from '../users/User.interface';
import {jwtDecode} from 'jwt-decode';

@Injectable({providedIn: 'root'})
export class AuthService {
  private authApiUrl = `${environment.apiBaseUrl}/auth`;

  private accessTokenKey = 'access_token';
  private refreshTokenKey = 'refresh_token';

  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {
    const token = localStorage.getItem(this.accessTokenKey);
    if (token) {
      const user: User = jwtDecode(token);
      this.userSubject.next(user);
    }
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

  refreshToken(): Observable<any> {

    const refreshToken = localStorage.getItem(this.refreshTokenKey);
    if (refreshToken && this.isTokenExpired(refreshToken)) {
      this.loginWithGoogle();
      return throwError(() => new Error('Refresh token expired'));
    }

    return this.http.post(`${this.authApiUrl}/refresh`, {'refresh': refreshToken});
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
      const decoded: any = jwtDecode(token);
      const exp = decoded.exp;
      const now = Math.floor(Date.now() / 1000);
      return exp < now;
    } catch (error) {
      return true;
    }
  }
}
