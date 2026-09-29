import { and, eq, isNull, sql } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { isNotEmptyArray } from '@rnw-community/shared';

import { Db } from '../../@generic/service/db.service';
import { ExchangeRateEntityTable } from '../table/exchange-rate-entity.table';

import type * as schema from '../../schema';
import type { ExchangeRateCreateEntityInterface } from '../entity/exchange-rate-create-entity.interface';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

export class ExchangeRateRepository {
    readonly bulkUpsert = Effect.fn('ExchangeRateRepository.bulkUpsert')(function* (inputs: ExchangeRateCreateEntityInterface[]) {
        if (!isNotEmptyArray(inputs)) {
            return;
        }

        yield* Db.query(db =>
            db
                .insert(ExchangeRateEntityTable)
                .values(inputs)
                .onConflictDoUpdate({
                    target: [ExchangeRateEntityTable.baseInstrumentId, ExchangeRateEntityTable.quoteInstrumentId],
                    set: {
                        rate: sql`excluded.rate`,
                        source: sql`excluded.source`,
                        updatedAt: new Date()
                    }
                })
        );
    });

    readonly upsert = Effect.fn('ExchangeRateRepository.upsert')(function* (
        baseInstrumentId: number,
        quoteInstrumentId: number,
        rate: number,
        source: string
    ) {
        yield* Db.query(db =>
            db
                .insert(ExchangeRateEntityTable)
                .values({ baseInstrumentId, quoteInstrumentId, rate, source })
                .onConflictDoUpdate({
                    target: [ExchangeRateEntityTable.baseInstrumentId, ExchangeRateEntityTable.quoteInstrumentId],
                    set: { rate, source }
                })
        );
    });

    constructor(private db: ExpoSQLiteDatabase<typeof schema>) {}

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
}
