import { eq } from 'drizzle-orm';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { isDefined } from '@rnw-community/shared';

import type { InstrumentEntityInterface } from '../entity/instrument-entity.interface';
import { InstrumentEntityTable } from '../table/instrument-entity.table';

export class InstrumentRepository {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(private db: ExpoSQLiteDatabase<any>) {}

    async getAll(): Promise<InstrumentEntityInterface[]> {
        try {
            return await this.db.select().from(InstrumentEntityTable);
        } catch {
            return [];
        }
    }

    async findById(id: number): Promise<InstrumentEntityInterface | null> {
        try {
            const [instrument] = await this.db.select().from(InstrumentEntityTable).where(eq(InstrumentEntityTable.id, id)).limit(1);

            return isDefined(instrument) ? instrument : null;
        } catch {
            return null;
        }
    }

    async findByCode(code: string): Promise<InstrumentEntityInterface | null> {
        try {
            const [instrument] = await this.db.select().from(InstrumentEntityTable).where(eq(InstrumentEntityTable.code, code)).limit(1);

            return isDefined(instrument) ? instrument : null;
        } catch {
            return null;
        }
    }

    async getIdByCode(code: string): Promise<number | null> {
        const instrument = await this.findByCode(code);

        return instrument?.id ?? null;
    }
}
