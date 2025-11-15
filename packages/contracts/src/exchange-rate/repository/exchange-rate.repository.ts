import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

import { ExchangeRateEntityTable } from '../table/exchange-rate-entity.table';

export class ExchangeRateRepository {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(private db: ExpoSQLiteDatabase<any>) {}

    async upsert(baseInstrumentId: number, quoteInstrumentId: number, rate: number, source: string): Promise<void> {
        await this.db
            .insert(ExchangeRateEntityTable)
            .values({
                baseInstrumentId,
                quoteInstrumentId,
                rate,
                source
            })
            .onConflictDoUpdate({
                target: [ExchangeRateEntityTable.baseInstrumentId, ExchangeRateEntityTable.quoteInstrumentId],
                set: {
                    rate,
                    source
                }
            });
    }
}
