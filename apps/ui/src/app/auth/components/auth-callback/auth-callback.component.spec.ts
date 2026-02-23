import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthCallbackComponent } from './auth-callback.component';
import { ActivatedRoute, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';

describe('AuthCallbackComponent', () => {
  let component: AuthCallbackComponent;
  let fixture: ComponentFixture<AuthCallbackComponent>;

  beforeEach(async () => {
    const routerStub = { navigate: jest.fn() } as unknown as Router;

    await TestBed.configureTestingModule({
      imports: [AuthCallbackComponent],
      providers: [
        provideHttpClient(),
        { provide: Router, useValue: routerStub },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({ access_token: 'test', refresh_token: 'test' }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthCallbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
