import { InstrumentEntityTable } from '@budgie/contracts';

import { db } from '../../drizzle/db/db';

import type { InstrumentEntityInterface } from '@budgie/contracts';


export const getAllInstruments = async (): Promise<InstrumentEntityInterface[]> => {
    try {
        return await db.select().from(InstrumentEntityTable);
    } catch {
        return [];
    }
};
