import { ExchangeRateEntityTable } from '@budgie/contracts';
import { and, eq } from 'drizzle-orm';

import { isDefined } from '@rnw-community/shared';


import { db } from '../../drizzle/db/db';

class ExchangeRateRepository {
    async upsert(baseInstrumentId: number, quoteInstrumentId: number, rate: number, source: string): Promise<void> {
        const [existingRate] = await db
            .select()
            .from(ExchangeRateEntityTable)
            .where(and(eq(ExchangeRateEntityTable.baseInstrumentId, baseInstrumentId), eq(ExchangeRateEntityTable.quoteInstrumentId, quoteInstrumentId)))
            .limit(1);

        if (isDefined(existingRate)) {
            await db
                .update(ExchangeRateEntityTable)
                .set({
                    rate,
                    source
                })
                .where(eq(ExchangeRateEntityTable.id, existingRate.id));
        } else {
            await db.insert(ExchangeRateEntityTable).values({
                baseInstrumentId,
                quoteInstrumentId,
                rate,
                source
            });
        }
    }
}

export const exchangeRateRepository = new ExchangeRateRepository();
