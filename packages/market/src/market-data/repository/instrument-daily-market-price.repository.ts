import { Db, InstrumentDailyMarketPriceEntityTable } from '@budgie/contracts';
import { and, asc, count, desc, eq, isNull, lte, min, or, sql } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { bulkUpsert } from '../../@generic/utils/bulk-upsert.util';

import type { InstrumentDailyMarketPriceCreateEntityInterface } from '@budgie/contracts';

export class InstrumentDailyMarketPriceRepository extends Context.Service<InstrumentDailyMarketPriceRepository>()(
    '@budgie/market/InstrumentDailyMarketPriceRepository',
    {
        make: Effect.sync(() => {
            const buildInstrumentQuoteCondition = (instrumentId: number, quoteInstrumentId: number) =>
                and(
                    eq(InstrumentDailyMarketPriceEntityTable.instrumentId, instrumentId),
                    eq(InstrumentDailyMarketPriceEntityTable.quoteInstrumentId, quoteInstrumentId),
                    isNull(InstrumentDailyMarketPriceEntityTable.deletedAt)
                );

            const buildInstrumentQuoteFilter = (instrumentId: number, quoteInstrumentId: number) =>
                ({
                    instrumentId,
                    quoteInstrumentId,
                    deletedAt: { isNull: true }
                }) as const;

            return {
                bulkUpsert: (inputs: InstrumentDailyMarketPriceCreateEntityInterface[]) =>
                    bulkUpsert(
                        InstrumentDailyMarketPriceEntityTable,
                        [
                            InstrumentDailyMarketPriceEntityTable.instrumentId,
                            InstrumentDailyMarketPriceEntityTable.quoteInstrumentId,
                            InstrumentDailyMarketPriceEntityTable.priceDate
                        ],
                        inputs,
                        ['price', 'marketCap', 'volume', 'source']
                    ),
                insertMissing: (inputs: InstrumentDailyMarketPriceCreateEntityInterface[]) =>
                    isNotEmptyArray(inputs)
                        ? Db.query(db => db.insert(InstrumentDailyMarketPriceEntityTable).values(inputs).onConflictDoNothing()).pipe(
                              Effect.asVoid
                          )
                        : Effect.void,
                findLatest: (instrumentId: number, quoteInstrumentId: number) =>
                    Db.query(db =>
                        db.query.InstrumentDailyMarketPriceEntityTable.findFirst({
                            where: buildInstrumentQuoteFilter(instrumentId, quoteInstrumentId),
                            orderBy: { priceDate: 'desc' }
                        })
                    ),
                findEarliest: (instrumentId: number, quoteInstrumentId: number) =>
                    Db.query(db =>
                        db.query.InstrumentDailyMarketPriceEntityTable.findFirst({
                            where: buildInstrumentQuoteFilter(instrumentId, quoteInstrumentId),
                            orderBy: { priceDate: 'asc' }
                        })
                    ),
                findEarliestPriceDate: (instrumentId: number) =>
                    Db.query(db =>
                        db
                            .select({ priceDate: min(InstrumentDailyMarketPriceEntityTable.priceDate) })
                            .from(InstrumentDailyMarketPriceEntityTable)
                            .where(
                                and(
                                    eq(InstrumentDailyMarketPriceEntityTable.instrumentId, instrumentId),
                                    isNull(InstrumentDailyMarketPriceEntityTable.deletedAt)
                                )
                            )
                    ).pipe(Effect.map(([row]) => row.priceDate)),
                findForDateOrBefore: (instrumentId: number, quoteInstrumentId: number, priceDate: string) =>
                    Db.query(db =>
                        db.query.InstrumentDailyMarketPriceEntityTable.findFirst({
                            where: { ...buildInstrumentQuoteFilter(instrumentId, quoteInstrumentId), priceDate: { lte: priceDate } },
                            orderBy: { priceDate: 'desc' }
                        })
                    ),
                findForDateOrAfter: (instrumentId: number, quoteInstrumentId: number, priceDate: string) =>
                    Db.query(db =>
                        db.query.InstrumentDailyMarketPriceEntityTable.findFirst({
                            where: { ...buildInstrumentQuoteFilter(instrumentId, quoteInstrumentId), priceDate: { gte: priceDate } },
                            orderBy: { priceDate: 'asc' }
                        })
                    ),
                findInDateRange: (instrumentId: number, quoteInstrumentId: number, fromDate: string, toDate: string) =>
                    Db.query(db =>
                        db.query.InstrumentDailyMarketPriceEntityTable.findMany({
                            where: {
                                ...buildInstrumentQuoteFilter(instrumentId, quoteInstrumentId),
                                priceDate: { gte: fromDate, lte: toDate }
                            },
                            orderBy: { priceDate: 'asc' }
                        })
                    ),
                findRecent: (instrumentId: number, quoteInstrumentId: number, limit: number) =>
                    Db.query(db =>
                        db.query.InstrumentDailyMarketPriceEntityTable.findMany({
                            where: buildInstrumentQuoteFilter(instrumentId, quoteInstrumentId),
                            orderBy: { priceDate: 'desc' },
                            limit
                        })
                    ),
                findRecentForPairs: (pairs: readonly (readonly [number, number])[], limit: number) => {
                    if (isEmptyArray(pairs)) {
                        return Effect.succeed([]);
                    }

                    const pairCondition = or(
                        ...pairs.map(([instrumentId, quoteInstrumentId]) =>
                            and(
                                eq(InstrumentDailyMarketPriceEntityTable.instrumentId, instrumentId),
                                eq(InstrumentDailyMarketPriceEntityTable.quoteInstrumentId, quoteInstrumentId)
                            )
                        )
                    );

                    return Db.query(db => {
                        const rankedPrices = db.$with('ranked_prices').as(
                            db
                                .select({
                                    instrumentId: InstrumentDailyMarketPriceEntityTable.instrumentId,
                                    quoteInstrumentId: InstrumentDailyMarketPriceEntityTable.quoteInstrumentId,
                                    priceDate: InstrumentDailyMarketPriceEntityTable.priceDate,
                                    price: InstrumentDailyMarketPriceEntityTable.price,
                                    rowNumber:
                                        sql<number>`ROW_NUMBER() OVER (PARTITION BY ${InstrumentDailyMarketPriceEntityTable.instrumentId}, ${InstrumentDailyMarketPriceEntityTable.quoteInstrumentId} ORDER BY ${InstrumentDailyMarketPriceEntityTable.priceDate} DESC)`.as(
                                            'row_number'
                                        )
                                })
                                .from(InstrumentDailyMarketPriceEntityTable)
                                .where(and(isNull(InstrumentDailyMarketPriceEntityTable.deletedAt), pairCondition))
                        );

                        return db
                            .with(rankedPrices)
                            .select({
                                instrumentId: rankedPrices.instrumentId,
                                quoteInstrumentId: rankedPrices.quoteInstrumentId,
                                priceDate: rankedPrices.priceDate,
                                price: rankedPrices.price
                            })
                            .from(rankedPrices)
                            .where(lte(rankedPrices.rowNumber, limit))
                            .orderBy(asc(rankedPrices.instrumentId), asc(rankedPrices.quoteInstrumentId), desc(rankedPrices.priceDate));
                    });
                },
                countByInstrumentAndQuote: (instrumentId: number, quoteInstrumentId: number) =>
                    Db.query(db =>
                        db
                            .select({ count: count() })
                            .from(InstrumentDailyMarketPriceEntityTable)
                            .where(buildInstrumentQuoteCondition(instrumentId, quoteInstrumentId))
                    )
            };
        })
    }
) {
    static readonly layer = Layer.effect(InstrumentDailyMarketPriceRepository, InstrumentDailyMarketPriceRepository.make);
}
