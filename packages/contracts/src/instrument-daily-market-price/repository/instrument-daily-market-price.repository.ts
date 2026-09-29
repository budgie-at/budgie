import { and, count, desc, eq, isNull, lte, sql } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { isNotEmptyArray } from '@rnw-community/shared';

import { Db } from '../../@generic/service/db.service';
import { InstrumentDailyMarketPriceEntityTable } from '../table/instrument-daily-market-price-entity.table';

import type { DB } from '../../@generic/type/db.type';
import type { InstrumentDailyMarketPriceCreateEntityInterface } from '../entity/instrument-daily-market-price-create-entity.interface';

export class InstrumentDailyMarketPriceRepository {
    readonly bulkUpsert = Effect.fn('InstrumentDailyMarketPriceRepository.bulkUpsert')(function* (
        inputs: InstrumentDailyMarketPriceCreateEntityInterface[]
    ) {
        if (!isNotEmptyArray(inputs)) {
            return;
        }

        yield* Db.query(db =>
            db
                .insert(InstrumentDailyMarketPriceEntityTable)
                .values(inputs)
                .onConflictDoUpdate({
                    target: [
                        InstrumentDailyMarketPriceEntityTable.instrumentId,
                        InstrumentDailyMarketPriceEntityTable.quoteInstrumentId,
                        InstrumentDailyMarketPriceEntityTable.priceDate
                    ],
                    set: {
                        price: sql`excluded.price`,
                        marketCap: sql`excluded.market_cap`,
                        volume: sql`excluded.volume`,
                        source: sql`excluded.source`,
                        updatedAt: new Date()
                    }
                })
        );
    });

    readonly findLatest = Effect.fn('InstrumentDailyMarketPriceRepository.findLatest')(function* (
        this: InstrumentDailyMarketPriceRepository,
        instrumentId: number,
        quoteInstrumentId: number
    ) {
        return yield* Db.query(db =>
            db.query.InstrumentDailyMarketPriceEntityTable.findFirst({
                where: this.buildInstrumentQuoteCondition(instrumentId, quoteInstrumentId),
                orderBy: desc(InstrumentDailyMarketPriceEntityTable.priceDate)
            })
        );
    });

    readonly findForDateOrBefore = Effect.fn('InstrumentDailyMarketPriceRepository.findForDateOrBefore')(function* (
        this: InstrumentDailyMarketPriceRepository,
        instrumentId: number,
        quoteInstrumentId: number,
        priceDate: string
    ) {
        return yield* Db.query(db =>
            db.query.InstrumentDailyMarketPriceEntityTable.findFirst({
                where: this.buildInstrumentQuoteDateCondition(instrumentId, quoteInstrumentId, priceDate),
                orderBy: desc(InstrumentDailyMarketPriceEntityTable.priceDate)
            })
        );
    });

    constructor(private db: DB) {}

    findRecent(instrumentId: number, quoteInstrumentId: number, limit: number) {
        return this.db.query.InstrumentDailyMarketPriceEntityTable.findMany({
            where: this.buildInstrumentQuoteCondition(instrumentId, quoteInstrumentId),
            orderBy: desc(InstrumentDailyMarketPriceEntityTable.priceDate),
            limit
        });
    }

    countByInstrumentAndQuote(instrumentId: number, quoteInstrumentId: number) {
        return this.db
            .select({ count: count() })
            .from(InstrumentDailyMarketPriceEntityTable)
            .where(this.buildInstrumentQuoteCondition(instrumentId, quoteInstrumentId));
    }

    private buildInstrumentQuoteDateCondition(instrumentId: number, quoteInstrumentId: number, priceDate: string) {
        return and(
            this.buildInstrumentQuoteCondition(instrumentId, quoteInstrumentId),
            lte(InstrumentDailyMarketPriceEntityTable.priceDate, priceDate)
        );
    }

    private buildInstrumentQuoteCondition(instrumentId: number, quoteInstrumentId: number) {
        return and(
            eq(InstrumentDailyMarketPriceEntityTable.instrumentId, instrumentId),
            eq(InstrumentDailyMarketPriceEntityTable.quoteInstrumentId, quoteInstrumentId),
            isNull(InstrumentDailyMarketPriceEntityTable.deletedAt)
        );
    }
}
