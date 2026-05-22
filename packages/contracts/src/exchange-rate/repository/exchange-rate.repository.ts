import { and, eq } from 'drizzle-orm';

import { ExchangeRateEntityTable } from '../table/exchange-rate-entity.table';

import type { DB } from '../../@generic/type/db.type';

export class ExchangeRateRepository {
    constructor(private db: DB) {}

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
