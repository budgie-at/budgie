import { Db, InstrumentDailyMarketPriceEntityTable } from '@budgie/contracts';
import { and, count, eq, isNull } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isNotEmptyArray } from '@rnw-community/shared';

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
                findRecent: (instrumentId: number, quoteInstrumentId: number, limit: number) =>
                    Db.query(db =>
                        db.query.InstrumentDailyMarketPriceEntityTable.findMany({
                            where: buildInstrumentQuoteFilter(instrumentId, quoteInstrumentId),
                            orderBy: { priceDate: 'desc' },
                            limit
                        })
                    ),
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
