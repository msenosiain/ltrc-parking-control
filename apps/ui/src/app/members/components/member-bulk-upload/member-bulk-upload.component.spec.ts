import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MemberBulkUploadComponent } from './member-bulk-upload.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogRef } from '@angular/material/dialog';

describe('MemberBulkUploadComponent', () => {
  let component: MemberBulkUploadComponent;
  let fixture: ComponentFixture<MemberBulkUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemberBulkUploadComponent, MatSnackBarModule],
      providers: [{ provide: MatDialogRef, useValue: { close: jest.fn() } }],
    }).compileComponents();

    fixture = TestBed.createComponent(MemberBulkUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('downloadFailuresCsv should create a blob and trigger download', () => {
    // prepare invalid rows and duplicates (use current component model)
    component.invalidRows = [
      { fullName: 'John Doe', dni: '123', errors: ['DNI duplicado'] },
    ];
    component.duplicateDnis = [{ dni: '8456087', message: 'DNI duplicado' }];

    // provide typed access to global URL methods to avoid `any`
    const globalUrl = URL as unknown as { createObjectURL?: (b: Blob) => string; revokeObjectURL?: (s: string) => void };
    if (typeof globalUrl.createObjectURL !== 'function') {
      (globalUrl as any).createObjectURL = jest.fn().mockReturnValue('blob:url');
      (globalUrl as any).revokeObjectURL = jest.fn();
    }
    const createUrlSpy = jest.spyOn(globalUrl as any, 'createObjectURL');
    const revokeSpy = jest.spyOn(globalUrl as any, 'revokeObjectURL');

    // spy on document.createElement and click
    const a = document.createElement('a');
    const clickSpy = jest.spyOn(a, 'click').mockImplementation(() => undefined);
    const createSpy = jest.spyOn(document, 'createElement').mockReturnValue(a as unknown as HTMLAnchorElement);

    component.downloadFailuresCsv();

    expect(createSpy).toHaveBeenCalledWith('a');
    expect(clickSpy).toHaveBeenCalled();

    createSpy.mockRestore();
    clickSpy.mockRestore();
    createUrlSpy.mockRestore();
    revokeSpy.mockRestore();
  });
});
