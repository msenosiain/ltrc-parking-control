import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MembersService } from '../../members.service';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialogRef } from '@angular/material/dialog';
import { Optional } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { Subscription } from 'rxjs';

/**
 * Represents a row coming from the bulk upload CSV/Excel file.
 */
interface MemberBulkRow {
  /** Full name as provided in the file (nombre column). */
  fullName: string;
  dni?: string;
  errors?: string[];
  rowNumber?: number;
}

/**
 * Failure object returned by the server for individual rows.
 */
interface ServerFailure {
  fullName?: string;
  dni?: string;
  message?: string;
  error?: unknown;
  rowNumber?: number;
}

/**
 * Dialog component used to upload members in bulk.
 * Visible UI text is intentionally written in Spanish per project convention;
 * comments and JSDoc are in English.
 */
@Component({
  selector: 'ltrc-member-bulk-upload',
  templateUrl: './member-bulk-upload.component.html',
  styleUrls: ['./member-bulk-upload.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatProgressSpinnerModule, MatTableModule, MatSnackBarModule, MatFormFieldModule, MatIconModule, MatInputModule, MatTooltipModule, MatDialogModule],
})
export class MemberBulkUploadComponent {
  /** Reference to the hidden file input element. */
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  /** Parsed rows extracted from the uploaded file. */
  rows: MemberBulkRow[] = [];

  /** Rows considered valid for upload. */
  validRows: MemberBulkRow[] = [];

  /** Rows with validation errors. */
  invalidRows: MemberBulkRow[] = [];

  /** Upload progress indicator. */
  loading = false;

  /** Currently selected file. */
  selectedFile: File | null = null;

  /** Selected file name to show in the UI. */
  selectedFileName = '';

  /** Rows with duplicate DNIs returned by the server after upload */
  duplicateDnis: Array<{ dni?: string; message?: string }> = [];

  /** Current upload subscription to prevent double submission. */
  private currentUploadSub: Subscription | null = null;

  /** Indicates whether an upload attempt completed (successfully or partially). Used to allow closing the dialog after upload. */
  uploadCompleted = false;

  constructor(private membersService: MembersService, private snack: MatSnackBar, @Optional() private dialogRef?: MatDialogRef<MemberBulkUploadComponent>) {}

  /**
   * Trigger the native file picker by clicking the hidden input.
   */
  openFilePicker() {
    this.fileInput?.nativeElement?.click();
  }

  /**
   * Close the dialog without performing an upload.
   */
  cancel() {
    this.dialogRef?.close(false);
  }

  /**
   * Handle the file selected event, read the file and parse CSV when applicable.
   * @param event native change event from the file input
   */
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.selectedFile = file;
    this.selectedFileName = file.name;
    this.rows = [];
    this.validRows = [];
    this.invalidRows = [];

    const name = file.name.toLowerCase();
    // Do not auto-upload on selection. Only parse CSVs for preview and validation.
    if (name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        this.parseCsv(text);
      };
      reader.onerror = () => {
        this.snack.open('Error leyendo el archivo', 'Cerrar', { duration: 3000 });
      };
      reader.readAsText(file, 'utf-8');
    } else {
      // For non-CSV files (xls/xlsx) we keep the file for direct upload
      // Do not show a toast here; the UI displays the filename in the field
      // this.snack.open(`Archivo listo para subir: ${file.name}`, 'Cerrar', { duration: 2000 });
    }
  }

  /**
   * Parse a CSV text into MemberBulkRow objects and separate valid/invalid rows.
   * The CSV is expected to contain at least 'nombre' and 'dni' columns.
   */
  private parseCsv(text: string) {
    this.rows = [];
    this.validRows = [];
    this.invalidRows = [];

    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length);
    if (lines.length === 0) {
      this.snack.open('CSV vacío', 'Cerrar', { duration: 2000 });
      return;
    }

    const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const mapCol = (names: string[]) => {
      for (let i = 0; i < header.length; i++) {
        if (names.includes(header[i])) return i;
      }
      return -1;
    };

    // Only two columns are required: nombre (full name) and dni
    const idxName = mapCol(['nombre', 'name', 'fullname', 'full_name']);
    const idxDni = mapCol(['dni', 'documento', 'document', 'cedula', 'rut']);

    if (idxName === -1 || idxDni === -1) {
      this.snack.open('El CSV debe contener columnas para nombre y DNI', 'Cerrar', { duration: 4000 });
      return;
    }

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim());
      const row: MemberBulkRow = {
        fullName: cols[idxName] || '',
        dni: cols[idxDni] || '',
        errors: [],
        rowNumber: i + 1, // CSV line number (1-based, header is 1)
      };
      this.validateRow(row);
      this.rows.push(row);
      if (row.errors && row.errors.length > 0) {
        this.invalidRows.push(row);
      } else {
        this.validRows.push(row);
      }
    }
  }

  /**
   * Validate a parsed row and populate the `errors` array with human-readable messages.
   */
  private validateRow(row: MemberBulkRow) {
    row.errors = [];
    // Require a full name and a DNI
    if (!row.fullName || row.fullName.trim().length === 0) row.errors.push('Nombre requerido');
    if (!row.dni) {
      row.errors.push('DNI requerido');
    } else {
      const dniDigits = String(row.dni).replace(/\./g, '');
      if (!/^\d+$/.test(dniDigits)) row.errors.push('DNI debe ser numérico');
      if (dniDigits.length < 7 || dniDigits.length > 8) row.errors.push('DNI debe tener entre 7 y 8 dígitos');
    }
  }

  /**
   * Returns true if any parsed row has validation errors.
   */
  hasErrors(): boolean {
    return this.invalidRows.length > 0;
  }

  /**
   * Column definitions used by the mat-table header/row defs.
   */
  get headerColumns(): string[] {
    return ['name', 'dni', 'errors'];
  }

  /**
   * Perform the upload: for CSVs send only valid rows to upload-rows endpoint;
   * for Excel files upload the file as before.
   */
  upload() {
    if (!this.selectedFile) {
      this.snack.open('Seleccione un archivo para subir', 'Cerrar', { duration: 3000 });
      return;
    }

    const name = this.selectedFile.name.toLowerCase();
    if (name.endsWith('.csv')) {
      if (this.validRows.length === 0) {
        this.snack.open('No hay filas válidas para subir', 'Cerrar', { duration: 3000 });
        return;
      }

      // prevent double submission
      if (this.currentUploadSub) {
        this.currentUploadSub.unsubscribe();
        this.currentUploadSub = null;
      }
      this.loading = true;
      // Map validRows to the shape expected by API (e.g., nombre, dni)
      const payload = this.validRows.map(r => ({ fullName: `${r.fullName}`, dni: (r.dni || '').toString(), rowNumber: r.rowNumber }));
      this.currentUploadSub = this.membersService.uploadMemberRows(payload).subscribe({
        next: (res: unknown) => {
          this.loading = false;
          this.currentUploadSub = null;
          this.uploadCompleted = true;
          // if backend returns inserted/duplicates structure
          if (res && typeof res === 'object' && ('inserted' in (res as any) || 'duplicates' in (res as any) || 'failures' in (res as any))) {
            const r = res as { inserted?: number; duplicates?: Array<{ dni?: string; message?: string }>; failures?: ServerFailure[] };
            const inserted = r.inserted ?? 0;
            const duplicates = r.duplicates ?? [];
            const failures = r.failures ?? [];
            this.duplicateDnis = duplicates;

            // Map server-side failures into invalidRows so UI shows them
            if (failures && failures.length) {
              const mapped = failures.map((f: ServerFailure) => ({ fullName: f.fullName ?? '', dni: f.dni, errors: [f.message ?? String(f.error ?? 'Error')], rowNumber: f.rowNumber }));
              this.invalidRows = this.invalidRows.concat(mapped);
            }

            const dupMsg = duplicates.length ? `; ${duplicates.length} duplicados` : '';
            const failMsg = failures.length ? `; ${failures.length} filas fallidas` : '';
            this.snack.open(`Carga completada. Insertados: ${inserted}${dupMsg}${failMsg}`, 'Cerrar', { duration: 5000 });
            if (duplicates.length === 0 && failures.length === 0) {
              // nothing failed -> close and indicate success
              this.dialogRef?.close(true);
              this.reset();
              return;
            }
            // partial failures -> keep dialog open but mark upload completed so user can close
          } else {
            // fallback: assume success
            this.snack.open('Carga masiva completada', 'Cerrar', { duration: 3000 });
            this.dialogRef?.close(true);
            this.reset();
          }
        },
        error: (err: HttpErrorResponse) => {
          this.loading = false;
          this.currentUploadSub = null;
          this.uploadCompleted = true;
          let msg = 'Error en la carga';
          if (err.error && typeof err.error === 'object') {
            const body = err.error as { message?: string };
            if (body.message) {
              msg = body.message;
            } else if (err.message) {
              msg = err.message;
            }
          } else if (err.message) {
            msg = err.message;
          }
          // If server returned detailed failures (e.g., duplicate key per row) try to map them
          try {
            const body = (err.error && typeof err.error === 'object') ? err.error as any : null;
            if (body && Array.isArray(body.failures)) {
              this.invalidRows = this.invalidRows.concat(body.failures.map((f: any) => ({ fullName: f.fullName ?? '', dni: f.dni, errors: [f.message ?? String(f.error ?? 'Error')], rowNumber: f.rowNumber })));
              this.snack.open(`Error: ${body.message ?? msg}`, 'Cerrar', { duration: 5000 });
              return;
            }
          } catch (e) {
            // ignore mapping error
          }
          this.snack.open(`Error: ${msg}`, 'Cerrar', { duration: 5000 });
        }
      });
    } else {
      // For Excel files use the existing uploadMembers(file) endpoint
      if (this.currentUploadSub) {
        this.currentUploadSub.unsubscribe();
        this.currentUploadSub = null;
      }
      this.loading = true;
      this.currentUploadSub = this.membersService.uploadMembers(this.selectedFile).subscribe({
        next: (res: unknown) => {
          this.loading = false;
          this.currentUploadSub = null;
          this.uploadCompleted = true;
          // If backend returns inserted/failures
          if (res && typeof res === 'object' && ('inserted' in (res as any) || 'failures' in (res as any))) {
            const r = res as { inserted?: number; failures?: ServerFailure[] };
            const inserted = r.inserted ?? 0;
            const failures = r.failures ?? [];
            // Map failures to invalidRows display format
            this.invalidRows = failures.map((f: ServerFailure) => ({ fullName: f.fullName ?? '', dni: f.dni, errors: [f.message ?? String(f.error ?? 'Error')], rowNumber: f.rowNumber }));
            const failMsg = failures.length ? `; ${failures.length} filas fallidas` : '';
            this.snack.open(`Carga completada. Insertados: ${inserted}${failMsg}`, 'Cerrar', { duration: 5000 });
            if (failures.length === 0) {
              this.dialogRef?.close(true);
              this.reset();
              return;
            }
          } else {
            this.snack.open('Carga masiva completada', 'Cerrar', { duration: 3000 });
            this.dialogRef?.close(true);
            this.reset();
          }
        },
        error: (err: HttpErrorResponse) => {
          this.loading = false;
          this.currentUploadSub = null;
          this.uploadCompleted = true;
          let msg = 'Error en la carga';
          if (err.error && typeof err.error === 'object') {
            const body = err.error as { message?: string };
            if (body.message) {
              msg = body.message;
            } else if (err.message) {
              msg = err.message;
            }
          } else if (err.message) {
            msg = err.message;
          }
          this.snack.open(`Error: ${msg}`, 'Cerrar', { duration: 5000 });
        }
      });
    }
  }

  /**
   * Download a CSV containing failures (invalidRows and server failures merged).
   */
  downloadFailuresCsv() {
    const escape = (v: string) => '"' + v.replace(/"/g, '""') + '"';
    const lines: string[] = [];
    // Headers in Spanish
    lines.push(['fila', 'nombre', 'dni', 'errores'].join(','));

    for (const r of this.invalidRows) {
      const fullName = `${r.fullName || ''}`.trim();
      const errors = (r.errors || []).join('; ');
      lines.push([r.rowNumber ?? '', escape(fullName), r.dni ?? '', escape(errors)].join(','));
    }

    // include server-side duplicates
    for (const d of this.duplicateDnis) {
      lines.push(['', '', d.dni ?? '', escape(d.message ?? '')].join(','));
    }

    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `member-upload-failures-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Reset all fields and state in the component.
   */
  reset() {
    this.rows = [];
    this.validRows = [];
    this.invalidRows = [];
    this.loading = false;
    this.selectedFile = null;
    this.selectedFileName = '';
    this.duplicateDnis = [];
  }

  /** Close the dialog (used after an upload completes, even if there were partial failures). */
  closeDialog() {
    this.dialogRef?.close(true);
  }
}
