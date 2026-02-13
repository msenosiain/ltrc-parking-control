import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import * as fs from 'node:fs';

@Injectable()
export class ExcelService {
  // Read an excel file from disk (kept for compatibility)
  readExcelFile(filePath: string): unknown[] {
    const file = fs.readFileSync(filePath);
    const workbook = XLSX.read(file, { type: 'buffer' });

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    return XLSX.utils.sheet_to_json(sheet) as unknown[];
  }

  readExcelBuffer(buffer: Buffer): unknown[] {
    const workbook = XLSX.read(Buffer.from(buffer), { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    return XLSX.utils.sheet_to_json(sheet) as unknown[];
  }
}
