import {Directive, Input, OnDestroy, OnInit, TemplateRef, ViewContainerRef,} from '@angular/core';
import {distinctUntilChanged, map, Subscription, tap} from 'rxjs';
import {AuthService} from '../auth.service';
import {Role} from '../roles.enum';

@Directive({
  selector: '[ltrcAllowedRoles]',
})
export class AllowedRolesDirective implements OnInit, OnDestroy {
  @Input('ltrcAllowedRoles') allowedRoles?: Role[];
  private sub?: Subscription;

  constructor(
    private authService: AuthService,
    private viewContainerRef: ViewContainerRef,
    private templateRef: TemplateRef<any>
  ) {
  }

  ngOnInit(): void {
    this.sub = this.authService.user$
      .pipe(
        map((user) => Boolean(user && user.roles.some(role => this.allowedRoles?.includes(role)))),
        distinctUntilChanged(),
        tap((hasRole) =>
          hasRole
            ? this.viewContainerRef.createEmbeddedView(this.templateRef)
            : this.viewContainerRef.clear()
        )
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
