import {CommonModule} from '@angular/common';
import {Component, inject} from '@angular/core';
import {MatSidenavModule} from "@angular/material/sidenav";
import {MatListModule} from "@angular/material/list";
import {Router, RouterModule} from "@angular/router";
import {Role} from '../auth/roles.enum';
import {AllowedRolesDirective} from '../auth/directives/allowed-roles.directive';
import {AuthService} from '../auth/auth.service';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'ltrc-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatSidenavModule, MatListModule, AllowedRolesDirective, MatButtonModule, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  Role = Role;
  public authService = inject(AuthService);
  public router = inject(Router);

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
