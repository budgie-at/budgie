import { and, eq } from 'drizzle-orm';

import * as schema from '../../schema';
import { ExchangeRateEntityTable } from '../table/exchange-rate-entity.table';

import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

export class ExchangeRateRepository {
    constructor(private db: ExpoSQLiteDatabase<typeof schema>) {}

    getAll() {
        return this.db.query.ExchangeRateEntityTable.findMany();
    }

    findByBaseAndQuoteIds(baseInstrumentId: number, quoteInstrumentId: number) {
        return this.db.query.ExchangeRateEntityTable.findFirst({
            where: and(
                eq(ExchangeRateEntityTable.baseInstrumentId, baseInstrumentId),
                eq(ExchangeRateEntityTable.quoteInstrumentId, quoteInstrumentId)
            )
        });
    }

    async upsert(baseInstrumentId: number, quoteInstrumentId: number, rate: bigint, source: string): Promise<void> {
        await this.db
            .insert(ExchangeRateEntityTable)
            .values({ baseInstrumentId, quoteInstrumentId, rate, source })
            .onConflictDoUpdate({
                target: [ExchangeRateEntityTable.baseInstrumentId, ExchangeRateEntityTable.quoteInstrumentId],
                set: { rate, source }
            });
    }
}
