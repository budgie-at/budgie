import { InstrumentEntityTable } from '@budgie/contracts';
import { eq } from 'drizzle-orm';

import { isDefined } from '@rnw-community/shared';

import { db } from '../../drizzle/db/db';

import type { InstrumentEntityInterface } from '@budgie/contracts';


class InstrumentRepository {
    async getAll(): Promise<InstrumentEntityInterface[]> {
        try {
            return await db.select().from(InstrumentEntityTable);
        } catch {
            return [];
        }
    }

    async findByCode(code: string): Promise<InstrumentEntityInterface | null> {
        try {
            const [instrument] = await db.select().from(InstrumentEntityTable).where(eq(InstrumentEntityTable.code, code)).limit(1);

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

export const instrumentRepository = new InstrumentRepository();
