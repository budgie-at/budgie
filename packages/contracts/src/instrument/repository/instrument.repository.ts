import { eq } from 'drizzle-orm';

import * as schema from '../../schema';
import { InstrumentEntityTable } from '../table/instrument-entity.table';

import type { InstrumentEntityInterface } from '../entity/instrument-entity.interface';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

export class InstrumentRepository {
    constructor(private db: ExpoSQLiteDatabase<typeof schema>) {}

    async getAll(): Promise<InstrumentEntityInterface[]> {
        return await this.db.query.InstrumentEntityTable.findMany();
    }

    async findById(id: number): Promise<InstrumentEntityInterface | undefined> {
        return await this.db.query.InstrumentEntityTable.findFirst({ where: eq(InstrumentEntityTable.id, id) });
    }

    async findByCode(code: string): Promise<InstrumentEntityInterface | undefined> {
        return await this.db.query.InstrumentEntityTable.findFirst({ where: eq(InstrumentEntityTable.code, code) });
    }
}
