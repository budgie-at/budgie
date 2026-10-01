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
            const buildPairCondition = (sourceInstrumentId: number, targetInstrumentId: number) =>
                ({
                    sourceInstrumentId,
                    targetInstrumentId,
                    deletedAt: { isNull: true }
                }) as const;

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
                    return yield* Db.query(db =>
                        db.query.HistoricalExchangeRateEntityTable.findFirst({
                            where: { ...buildPairCondition(sourceInstrumentId, targetInstrumentId), rateDate: { lte: rateDate } },
                            orderBy: { rateDate: 'desc' }
                        })
                    );
                }),
                findEarliest: Effect.fn('HistoricalExchangeRateRepository.findEarliest')(function* (
                    sourceInstrumentId: number,
                    targetInstrumentId: number
                ) {
                    return yield* Db.query(db =>
                        db.query.HistoricalExchangeRateEntityTable.findFirst({
                            where: buildPairCondition(sourceInstrumentId, targetInstrumentId),
                            orderBy: { rateDate: 'asc' }
                        })
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
