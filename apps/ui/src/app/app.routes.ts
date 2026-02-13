import {Routes} from '@angular/router';
import {DashboardComponent} from './dashboard/dashboard.component';
import {SearchMemberComponent} from './members/components/search-member/search-member.component';
import {AuthCallbackComponent} from './auth/components/auth-callback/auth-callback.component';
import {authGuard} from './auth/guards/auth.guard';
import {MembersListComponent} from './members/components/members-list/members-list.component';
import {hasRoleGuard} from './auth/guards/has-role.guard';
import {Role} from './auth/roles.enum';

export const routes: Routes = [
  {path: '', component: SearchMemberComponent},
  {path: 'auth/callback', component: AuthCallbackComponent},
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard, hasRoleGuard],
    data: {allowedRoles: [Role.USER, Role.ADMIN]},
    children: [
      {
        path: 'members',
        component: MembersListComponent,
        canActivate: [hasRoleGuard],
        data: {allowedRoles: [Role.ADMIN]}
      },
    ]
  },
  {path: '**', redirectTo: '/'}
];
