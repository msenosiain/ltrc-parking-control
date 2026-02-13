import {ChangeDetectorRef, Component} from '@angular/core';
import {Router, RouterOutlet} from '@angular/router';
import {MatToolbarModule} from '@angular/material/toolbar';
import {AuthService} from './auth/auth.service';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';

@Component({
  selector: 'ltrc-root',
  imports: [CommonModule, RouterOutlet, MatButtonModule, MatToolbarModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  title = 'Estacionamiento LTRC';
  // @ts-ignore
  user$;

  constructor(private authService: AuthService, private router: Router, private cd: ChangeDetectorRef) {
    this.user$ = this.authService.user$;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
