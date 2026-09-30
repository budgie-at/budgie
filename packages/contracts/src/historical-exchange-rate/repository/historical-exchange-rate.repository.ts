import { SQL, and, asc, desc, eq, isNull, lte } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { Db } from '../../@generic/service/db.service';
import { bulkUpsert } from '../../@generic/util/bulk-upsert.util';
import { HistoricalExchangeRateEntityTable } from '../table/historical-exchange-rate-entity.table';

import type { HistoricalExchangeRateCreateEntityInterface } from '../entity/historical-exchange-rate-create-entity.interface';

export class HistoricalExchangeRateRepository extends Context.Service<HistoricalExchangeRateRepository>()(
    '@budgie/contracts/HistoricalExchangeRateRepository',
    {
        make: Effect.sync(() => {
            const buildPairCondition = (sourceInstrumentId: number, targetInstrumentId: number): SQL | undefined =>
                and(
                    eq(HistoricalExchangeRateEntityTable.sourceInstrumentId, sourceInstrumentId),
                    eq(HistoricalExchangeRateEntityTable.targetInstrumentId, targetInstrumentId),
                    isNull(HistoricalExchangeRateEntityTable.deletedAt)
                );

            const findFirstRate = (where: SQL | undefined, order: SQL) =>
                Db.query(db => db.query.HistoricalExchangeRateEntityTable.findFirst({ where, orderBy: order }));

            return {
                bulkUpsert: (inputs: HistoricalExchangeRateCreateEntityInterface[]) =>
                    bulkUpsert(
                        HistoricalExchangeRateEntityTable,
                        [
                            HistoricalExchangeRateEntityTable.sourceInstrumentId,
                            HistoricalExchangeRateEntityTable.targetInstrumentId,
                            HistoricalExchangeRateEntityTable.rateDate
                        ],
                        inputs,
                        ['rate']
                    ),
                findForDateOrBefore: Effect.fn('HistoricalExchangeRateRepository.findForDateOrBefore')(function* (
                    sourceInstrumentId: number,
                    targetInstrumentId: number,
                    rateDate: string
                ) {
                    const where = and(
                        buildPairCondition(sourceInstrumentId, targetInstrumentId),
                        lte(HistoricalExchangeRateEntityTable.rateDate, rateDate)
                    );

                    return yield* findFirstRate(where, desc(HistoricalExchangeRateEntityTable.rateDate));
                }),
                findEarliest: Effect.fn('HistoricalExchangeRateRepository.findEarliest')(function* (
                    sourceInstrumentId: number,
                    targetInstrumentId: number
                ) {
                    return yield* findFirstRate(
                        buildPairCondition(sourceInstrumentId, targetInstrumentId),
                        asc(HistoricalExchangeRateEntityTable.rateDate)
                    );
                }),
                upsert: (input: HistoricalExchangeRateCreateEntityInterface) =>
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
                    )
            };
        })
    }
) {
    static readonly layer = Layer.effect(HistoricalExchangeRateRepository, HistoricalExchangeRateRepository.make);
}
