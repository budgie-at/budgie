import { Log } from '@budgie/logger';
import { and, eq, isNull, sql } from 'drizzle-orm';

import { getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { ExchangeRateEntityTable } from '../table/exchange-rate-entity.table';

import type { DB } from '../../@generic/type/db.type';
import type * as schema from '../../schema';
import type { ExchangeRateCreateEntityInterface } from '../entity/exchange-rate-create-entity.interface';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

export class ExchangeRateRepository {
    constructor(private db: ExpoSQLiteDatabase<typeof schema>) {}

    @Log(
        (inputs, tx) =>
            `enter baseInstrumentIds=${inputs.map(input => input.baseInstrumentId).join(',')} quoteInstrumentIds=${inputs.map(input => input.quoteInstrumentId).join(',')} hasTx=${String(isDefined(tx))}`,
        (result, inputs, tx) =>
            `done baseInstrumentIds=${inputs.map(input => input.baseInstrumentId).join(',')} quoteInstrumentIds=${inputs.map(input => input.quoteInstrumentId).join(',')} hasTx=${String(isDefined(tx))} hasResult=${String(isDefined(result))}`,
        (error, inputs, tx) =>
            `throw baseInstrumentIds=${inputs.map(input => input.baseInstrumentId).join(',')} quoteInstrumentIds=${inputs.map(input => input.quoteInstrumentId).join(',')} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async bulkUpsert(inputs: ExchangeRateCreateEntityInterface[], tx?: DB): Promise<void> {
        if (!isNotEmptyArray(inputs)) {
            return;
        }

        await (tx ?? this.db)
            .insert(ExchangeRateEntityTable)
            .values(inputs)
            .onConflictDoUpdate({
                target: [ExchangeRateEntityTable.baseInstrumentId, ExchangeRateEntityTable.quoteInstrumentId],
                set: {
                    rate: sql`excluded.rate`,
                    source: sql`excluded.source`,
                    updatedAt: new Date()
                }
            });
    }

    getLatestUpdatedAt() {
        return this.db
            .select({
                updatedAt: sql<Date | null>`MAX(${ExchangeRateEntityTable.updatedAt})`
            })
            .from(ExchangeRateEntityTable)
            .where(isNull(ExchangeRateEntityTable.deletedAt));
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
