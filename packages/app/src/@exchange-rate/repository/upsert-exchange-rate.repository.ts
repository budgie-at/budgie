import { ExchangeRateEntityTable } from '@budgie/contracts';
import { and, eq } from 'drizzle-orm';


import { db } from '../../drizzle/db/db';

export const upsertExchangeRate = async (
    baseInstrumentId: number,
    quoteInstrumentId: number,
    rate: number,
    source: string
): Promise<void> => {
    const existingRates = await db
        .select()
        .from(ExchangeRateEntityTable)
        .where(and(eq(ExchangeRateEntityTable.baseInstrumentId, baseInstrumentId), eq(ExchangeRateEntityTable.quoteInstrumentId, quoteInstrumentId)))
        .limit(1);

    if (existingRates.length > 0) {
        await db
            .update(ExchangeRateEntityTable)
            .set({
                rate,
                source
            })
            .where(eq(ExchangeRateEntityTable.id, existingRates[0].id));
    } else {
        await db.insert(ExchangeRateEntityTable).values({
            baseInstrumentId,
            quoteInstrumentId,
            rate,
            source
        });
    }
};
