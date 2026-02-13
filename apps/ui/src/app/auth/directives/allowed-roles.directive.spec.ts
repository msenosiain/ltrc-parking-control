import {AllowedRolesDirective} from './allowed-roles.directive';
import {AuthService} from '../auth.service';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {Component} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {User} from '../../users/User.interface';
import {Role} from '../roles.enum';
import {By} from '@angular/platform-browser';

class MockAuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  setUser(user: User | null) {
    this.userSubject.next(user);
  }
}

@Component({
  template: `<p *ltrcAllowedRoles="[Role.ADMIN]" class="admin-content">Admin Only</p>`,
  imports: [AllowedRolesDirective],
})
class TestComponent {
  Role = Role;
}

describe('AllowedRolesDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let mockService: MockAuthService;

  beforeEach(() => {
    mockService = new MockAuthService();

    TestBed.configureTestingModule({
      imports: [TestComponent],
      providers: [{provide: AuthService, useValue: mockService}]
    });

    fixture = TestBed.createComponent(TestComponent);
    fixture.detectChanges();
  });

  it('should show element when user is admin', () => {
    mockService.setUser({
      googleId: '1234',
      name: 'Alice',
      lastName: 'Cooper',
      email: 'alice.cooper@lostordos.com.ar',
      roles: [Role.ADMIN]
    });
    fixture.detectChanges();

    const content = fixture.debugElement.query(By.css('.admin-content'));
    expect(content).toBeTruthy();
    expect(content.nativeElement.textContent.trim()).toBe('Admin Only');
  });

  it('should hide element when user is not admin', () => {
    mockService.setUser({googleId: '1234',
      name: 'Alice',
      lastName: 'Cooper',
      email: 'alice.cooper@lostordos.com.ar',
      roles: [Role.USER]});
    fixture.detectChanges();

    const content = fixture.debugElement.query(By.css('.admin-content'));
    expect(content).toBeNull();
  });


});
