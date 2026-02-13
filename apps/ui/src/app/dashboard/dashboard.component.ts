import { Component } from '@angular/core';
import {MatSidenavModule} from "@angular/material/sidenav";
import {MatListModule} from "@angular/material/list";
import {RouterModule, RouterOutlet} from "@angular/router";
import { Role } from '../auth/roles.enum';
import {AllowedRolesDirective} from '../auth/directives/allowed-roles.directive';

@Component({
  selector: 'ltrc-dashboard',
  imports: [RouterModule, MatSidenavModule, MatListModule, AllowedRolesDirective],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  Role = Role;

}
