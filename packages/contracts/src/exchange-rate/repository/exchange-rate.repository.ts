import { and, eq, inArray } from 'drizzle-orm';

import * as schema from '../../schema';
import { ExchangeRateEntityTable } from '../table/exchange-rate-entity.table';

import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

export class ExchangeRateRepository {
    constructor(private db: ExpoSQLiteDatabase<typeof schema>) {}

    getAll() {
        return this.db.query.ExchangeRateEntityTable.findMany();
    }

    findByBaseAndQuoteIds(baseInstrumentId: number, quoteInstrumentIds: number[]) {
        return this.db.query.ExchangeRateEntityTable.findMany({
            where: and(
                eq(ExchangeRateEntityTable.baseInstrumentId, baseInstrumentId),
                inArray(ExchangeRateEntityTable.quoteInstrumentId, quoteInstrumentIds)
            )
        });
    }

    async upsert(baseInstrumentId: number, quoteInstrumentId: number, rate: number, source: string): Promise<void> {
        await this.db
            .insert(ExchangeRateEntityTable)
            .values({ baseInstrumentId, quoteInstrumentId, rate, source })
            .onConflictDoUpdate({
                target: [ExchangeRateEntityTable.baseInstrumentId, ExchangeRateEntityTable.quoteInstrumentId],
                set: { rate, source }
            });
    }
}
