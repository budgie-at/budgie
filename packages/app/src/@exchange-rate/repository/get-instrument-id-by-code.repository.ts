import { InstrumentEntityTable } from '@budgie/contracts';
import { eq } from 'drizzle-orm';


import { db } from '../../drizzle/db/db';

export const getInstrumentIdByCode = async (code: string): Promise<number | null> => {
    try {
        const instruments = await db.select().from(InstrumentEntityTable).where(eq(InstrumentEntityTable.code, code)).limit(1);

        if (instruments.length === 0) {
            return null;
        }

        return instruments[0].id;
    } catch {
        return null;
    }
};
