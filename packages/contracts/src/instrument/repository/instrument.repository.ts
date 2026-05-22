import { eq } from 'drizzle-orm';

import { InstrumentTypeEnum } from '../enum/instrument-type.enum';
import { InstrumentEntityTable } from '../table/instrument-entity.table';

import type { DB } from '../../@generic/type/db.type';
import type { InstrumentEntityInterface } from '../entity/instrument-entity.interface';

export class InstrumentRepository {
    constructor(private db: DB) {}

    async getAll(): Promise<InstrumentEntityInterface[]> {
        return await this.db.query.InstrumentEntityTable.findMany();
    }

    findAll() {
        return this.db.query.InstrumentEntityTable.findMany();
    }

    findById(id: number) {
        return this.db.query.InstrumentEntityTable.findFirst({ where: eq(InstrumentEntityTable.id, id) });
    }

    async findByIdAsync(id: number): Promise<InstrumentEntityInterface | undefined> {
        return await this.db.query.InstrumentEntityTable.findFirst({ where: eq(InstrumentEntityTable.id, id) });
    }

    async findByCode(code: string): Promise<InstrumentEntityInterface | undefined> {
        return await this.db.query.InstrumentEntityTable.findFirst({ where: eq(InstrumentEntityTable.code, code) });
    }

    findByType(type: InstrumentTypeEnum) {
        return this.db.query.InstrumentEntityTable.findMany({ where: eq(InstrumentEntityTable.type, type) });
    }
}
