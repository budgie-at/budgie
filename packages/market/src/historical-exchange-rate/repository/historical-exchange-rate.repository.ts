import { Db, HistoricalExchangeRateEntityTable } from '@budgie/contracts';
import { and, asc, eq, gte, isNull, or, sql } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { bulkUpsert } from '../../@generic/utils/bulk-upsert.util';

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
                findGapStartDate: (sourceInstrumentId: number, targetInstrumentId: number, sinceDate: string, maxGapDays: number) =>
                    Db.query(db => {
                        const rates = db
                            .select({
                                rateDate: HistoricalExchangeRateEntityTable.rateDate,
                                nextRateDate: sql<
                                    string | null
                                >`LEAD(${HistoricalExchangeRateEntityTable.rateDate}) OVER (ORDER BY ${HistoricalExchangeRateEntityTable.rateDate})`.as(
                                    'next_rate_date'
                                )
                            })
                            .from(HistoricalExchangeRateEntityTable)
                            .where(
                                and(
                                    eq(HistoricalExchangeRateEntityTable.sourceInstrumentId, sourceInstrumentId),
                                    eq(HistoricalExchangeRateEntityTable.targetInstrumentId, targetInstrumentId),
                                    isNull(HistoricalExchangeRateEntityTable.deletedAt),
                                    gte(HistoricalExchangeRateEntityTable.rateDate, sinceDate)
                                )
                            )
                            .as('rates');

                        return db
                            .select({ rateDate: rates.rateDate })
                            .from(rates)
                            .where(
                                or(
                                    isNull(rates.nextRateDate),
                                    sql`julianday(${rates.nextRateDate}) - julianday(${rates.rateDate}) > ${maxGapDays}`
                                )
                            )
                            .orderBy(asc(rates.rateDate))
                            .limit(1);
                    }).pipe(Effect.map(rows => rows.at(0)?.rateDate ?? null)),
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
