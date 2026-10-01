import { and, count, eq, isNull } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { Db } from '../../@generic/service/db.service';
import { bulkUpsert } from '../../@generic/util/bulk-upsert.util';
import { InstrumentDailyMarketPriceEntityTable } from '../table/instrument-daily-market-price-entity.table';

import type { InstrumentDailyMarketPriceCreateEntityInterface } from '../entity/instrument-daily-market-price-create-entity.interface';

export class InstrumentDailyMarketPriceRepository extends Context.Service<InstrumentDailyMarketPriceRepository>()(
    '@budgie/contracts/InstrumentDailyMarketPriceRepository',
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
