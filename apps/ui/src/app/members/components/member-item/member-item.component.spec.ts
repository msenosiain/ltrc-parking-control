import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MemberItemComponent } from './member-item.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideHttpClient } from '@angular/common/http';

describe('MemberItemComponent', () => {
  let component: MemberItemComponent;
  let fixture: ComponentFixture<MemberItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemberItemComponent],
      providers: [
        provideHttpClient(),
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: { member: { fullName: 'Test', dni: '12345678' } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MemberItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
