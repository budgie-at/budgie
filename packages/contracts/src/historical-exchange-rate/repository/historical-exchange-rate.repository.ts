import { SQL, and, asc, desc, eq, isNull, lte, sql } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { isNotEmptyArray } from '@rnw-community/shared';

import { Db } from '../../@generic/service/db.service';
import { HistoricalExchangeRateEntityTable } from '../table/historical-exchange-rate-entity.table';

import type { HistoricalExchangeRateCreateEntityInterface } from '../entity/historical-exchange-rate-create-entity.interface';

export class HistoricalExchangeRateRepository {
    readonly bulkUpsert = Effect.fn('HistoricalExchangeRateRepository.bulkUpsert')(function* (
        inputs: HistoricalExchangeRateCreateEntityInterface[]
    ) {
        if (!isNotEmptyArray(inputs)) {
            return;
        }

        yield* Db.query(db =>
            db
                .insert(HistoricalExchangeRateEntityTable)
                .values(inputs)
                .onConflictDoUpdate({
                    target: [
                        HistoricalExchangeRateEntityTable.sourceInstrumentId,
                        HistoricalExchangeRateEntityTable.targetInstrumentId,
                        HistoricalExchangeRateEntityTable.rateDate
                    ],
                    set: {
                        rate: sql`excluded.rate`,
                        updatedAt: new Date()
                    }
                })
        );
    });

    readonly findForDateOrBefore = Effect.fn('HistoricalExchangeRateRepository.findForDateOrBefore')(function* (
        this: HistoricalExchangeRateRepository,
        sourceInstrumentId: number,
        targetInstrumentId: number,
        rateDate: string
    ) {
        const where = and(
            this.buildPairCondition(sourceInstrumentId, targetInstrumentId),
            lte(HistoricalExchangeRateEntityTable.rateDate, rateDate)
        );

        return yield* this.findFirstRate(where, desc(HistoricalExchangeRateEntityTable.rateDate));
    });

    readonly findEarliest = Effect.fn('HistoricalExchangeRateRepository.findEarliest')(function* (
        this: HistoricalExchangeRateRepository,
        sourceInstrumentId: number,
        targetInstrumentId: number
    ) {
        const where = this.buildPairCondition(sourceInstrumentId, targetInstrumentId);

        return yield* this.findFirstRate(where, asc(HistoricalExchangeRateEntityTable.rateDate));
    });

    private readonly findFirstRate = Effect.fnUntraced(function* (where: SQL | undefined, order: SQL) {
        return yield* Db.query(db => db.query.HistoricalExchangeRateEntityTable.findFirst({ where, orderBy: order }));
    });

    readonly upsert = (input: HistoricalExchangeRateCreateEntityInterface) =>
        Db.query(db =>
            db
                .insert(HistoricalExchangeRateEntityTable)
                .values(input)
                .onConflictDoUpdate({
                    target: [
                        HistoricalExchangeRateEntityTable.sourceInstrumentId,
                        HistoricalExchangeRateEntityTable.targetInstrumentId,
                        HistoricalExchangeRateEntityTable.rateDate
                    ],
                    set: {
                        rate: input.rate,
                        updatedAt: new Date()
                    }
                })
        );

    private buildPairCondition(sourceInstrumentId: number, targetInstrumentId: number): SQL | undefined {
        return and(
            eq(HistoricalExchangeRateEntityTable.sourceInstrumentId, sourceInstrumentId),
            eq(HistoricalExchangeRateEntityTable.targetInstrumentId, targetInstrumentId),
            isNull(HistoricalExchangeRateEntityTable.deletedAt)
        );
    }
}
