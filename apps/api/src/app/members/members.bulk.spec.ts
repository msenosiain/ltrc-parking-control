import { MembersService } from './members.service';

class MockModel {
  private storage: any[] = [];

  constructor(private existing: any[] = []) {
    this.storage = [...existing];
  }

  find(query: any) {
    if (query && query.dni && query.dni.$in) {
      const docs = this.storage.filter((d: any) => query.dni.$in.includes(d.dni));
      return {
        select: (_fields?: string) => ({
          lean: () => ({ exec: async () => docs }),
        }),
      } as any;
    }
    return this.storage;
  }

  async bulkWrite(ops: any[], opts: any) {
    const writeErrors: any[] = [];
    for (let i = 0; i < ops.length; i++) {
      const doc = ops[i].insertOne.document;
      const exists = this.storage.find((s: any) => s.dni === doc.dni);
      if (exists) {
        writeErrors.push({ index: i, err: { code: 11000, errmsg: `dup key: ${doc.dni}` } });
      } else {
        this.storage.push(doc);
      }
    }
    if (writeErrors.length > 0) {
      const err: any = new Error('Bulk write error');
      err.writeErrors = writeErrors;
      throw err;
    }
    return { insertedCount: ops.length } as any;
  }

  async create(doc: any) {
    const exists = this.storage.find((s: any) => s.dni === doc.dni);
    if (exists) {
      const err: any = new Error('duplicate');
      (err as any).code = 11000;
      throw err;
    }
    this.storage.push(doc);
    return doc;
  }
}

describe('MembersService.createMembersBulk (bulk spec)', () => {
  it('inserts first occurrence and reports duplicates in-file as failures', async () => {
    const mockModel = new MockModel([]) as any;
    const svc: any = new MembersService(mockModel);

    const input = [
      { rowNumber: 2, fullName: 'Alice', dni: '123' },
      { rowNumber: 3, fullName: 'Bob', dni: '123' },
      { rowNumber: 4, fullName: 'Charlie', dni: '456' },
    ];

    const res = await svc.createMembersBulk(input);

    expect(res.inserted.map((i: any) => i.dni).sort()).toEqual(['123', '456']);
    const dup = res.failures.find((f: any) => f.rowNumber === 3 && f.message.includes('DNI duplicado'));
    expect(dup).toBeTruthy();
  });
});
