import {ChangeDetectorRef, Component} from '@angular/core';
import {Router, RouterLink, RouterOutlet} from '@angular/router';
import {MatToolbarModule} from '@angular/material/toolbar';
import {AuthService} from './auth/auth.service';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {Observable} from 'rxjs';
import {User} from './users/User.interface';

@Component({
  selector: 'ltrc-root',
  imports: [CommonModule, RouterOutlet, MatButtonModule, MatToolbarModule, RouterLink],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  title = 'Estacionamiento LTRC';
  user$: Observable<User | null>;

  constructor(private authService: AuthService, private router: Router, private cd: ChangeDetectorRef) {
    this.user$ = this.authService.user$;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
