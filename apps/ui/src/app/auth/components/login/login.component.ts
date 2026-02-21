import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {AuthService} from '../../auth.service';
import {Router} from '@angular/router';

@Component({
  selector: 'ltrc-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  template: `
    <div class="login-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Iniciar Sesión</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="fill">
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" type="email" placeholder="email@ejemplo.com">
              @if (loginForm.get('email')?.hasError('required')) {
                <mat-error>El email es requerido</mat-error>
              }
              @if (loginForm.get('email')?.hasError('email')) {
                <mat-error>Formato de email inválido</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="fill">
              <mat-label>Contraseña</mat-label>
              <input matInput formControlName="pass" type="password">
              @if (loginForm.get('pass')?.hasError('required')) {
                <mat-error>La contraseña es requerida</mat-error>
              }
            </mat-form-field>

            @if (errorMessage) {
              <div class="error-message">
                {{ errorMessage }}
              </div>
            }

            <button mat-raised-button color="primary" type="submit" [disabled]="loginForm.invalid || isLoading">
              {{ isLoading ? 'Cargando...' : 'Entrar' }}
            </button>

            <div class="divider">
              <span>O</span>
            </div>

            <button mat-stroked-button type="button" (click)="loginWithGoogle()" class="google-button">
              <img src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg" alt="Google logo">
              Entrar con Google
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background-color: #f5f5f5;
    }
    mat-card {
      width: 400px;
      padding: 20px;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    .error-message {
      color: #f44336;
      font-size: 14px;
      margin-bottom: 10px;
    }
    button {
      margin-top: 10px;
    }
    .divider {
      display: flex;
      align-items: center;
      text-align: center;
      margin: 10px 0;
    }
    .divider::before, .divider::after {
      content: '';
      flex: 1;
      border-bottom: 1px solid #ccc;
    }
    .divider span {
      padding: 0 10px;
      color: #777;
      font-size: 14px;
    }
    .google-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    .google-button img {
      width: 18px;
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    pass: new FormControl('', [Validators.required])
  });

  isLoading = false;
  errorMessage = '';

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      const {email, pass} = this.loginForm.value;
      this.authService.login(email!, pass!).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = 'Credenciales inválidas o error de conexión';
          console.error(err);
        }
      });
    }
  }

  loginWithGoogle() {
    this.authService.loginWithGoogle();
  }
}
