import { Db, HistoricalExchangeRateEntityTable } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { bulkUpsert } from '../../@generic/util/bulk-upsert.util';

import type { HistoricalExchangeRateCreateEntityInterface } from '@budgie/contracts';

export class HistoricalExchangeRateRepository extends Context.Service<HistoricalExchangeRateRepository>()(
    '@budgie/market/HistoricalExchangeRateRepository',
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
                findForDateOrBefore: (sourceInstrumentId: number, targetInstrumentId: number, rateDate: string) =>
                    Db.query(db =>
                        db.query.HistoricalExchangeRateEntityTable.findFirst({
                            where: { ...buildPairCondition(sourceInstrumentId, targetInstrumentId), rateDate: { lte: rateDate } },
                            orderBy: { rateDate: 'desc' }
                        })
                    ),
                findEarliest: (sourceInstrumentId: number, targetInstrumentId: number) =>
                    Db.query(db =>
                        db.query.HistoricalExchangeRateEntityTable.findFirst({
                            where: buildPairCondition(sourceInstrumentId, targetInstrumentId),
                            orderBy: { rateDate: 'asc' }
                        })
                    )
            };
        })
    }
) {
    static readonly layer = Layer.effect(HistoricalExchangeRateRepository, HistoricalExchangeRateRepository.make);
}
