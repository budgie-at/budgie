import { Log } from '@budgie/logger';
import { and, count, desc, eq, isNull, lte, sql } from 'drizzle-orm';

import { getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { InstrumentDailyMarketPriceEntityTable } from '../table/instrument-daily-market-price-entity.table';

import type { DB } from '../../@generic/type/db.type';
import type { InstrumentDailyMarketPriceCreateEntityInterface } from '../entity/instrument-daily-market-price-create-entity.interface';
import type { InstrumentDailyMarketPriceEntityInterface } from '../entity/instrument-daily-market-price-entity.interface';

export class InstrumentDailyMarketPriceRepository {
    constructor(private db: DB) {}

    @Log(
        inputs =>
            `enter instrumentIds=${inputs.map(input => input.instrumentId).join(',')} quoteInstrumentIds=${inputs.map(input => input.quoteInstrumentId).join(',')} priceDates=${inputs.map(input => input.priceDate).join(',')}`,
        (_result, inputs) =>
            `done instrumentIds=${inputs.map(input => input.instrumentId).join(',')} quoteInstrumentIds=${inputs.map(input => input.quoteInstrumentId).join(',')} priceDates=${inputs.map(input => input.priceDate).join(',')}`,
        (error, inputs) =>
            `throw instrumentIds=${inputs.map(input => input.instrumentId).join(',')} quoteInstrumentIds=${inputs.map(input => input.quoteInstrumentId).join(',')} priceDates=${inputs.map(input => input.priceDate).join(',')} error=${getErrorMessage(error)}`
    )
    async bulkUpsert(inputs: InstrumentDailyMarketPriceCreateEntityInterface[], tx?: DB): Promise<void> {
        if (!isNotEmptyArray(inputs)) {
            return;
        }

        await (tx ?? this.db)
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
            });
    }

    @Log(
        (instrumentId, quoteInstrumentId, tx) =>
            `enter lookup=latest-price instrumentId=${instrumentId} quoteInstrumentId=${quoteInstrumentId} hasTx=${String(isDefined(tx))}`,
        (result, instrumentId, quoteInstrumentId, tx) =>
            `done lookup=latest-price instrumentId=${instrumentId} quoteInstrumentId=${quoteInstrumentId} hasTx=${String(isDefined(tx))} found=${String(isDefined(result))}`,
        (error, instrumentId, quoteInstrumentId, tx) =>
            `throw lookup=latest-price instrumentId=${instrumentId} quoteInstrumentId=${quoteInstrumentId} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async findLatest(
        instrumentId: number,
        quoteInstrumentId: number,
        tx?: DB
    ): Promise<InstrumentDailyMarketPriceEntityInterface | undefined> {
        return await (tx ?? this.db).query.InstrumentDailyMarketPriceEntityTable.findFirst({
            where: this.buildInstrumentQuoteCondition(instrumentId, quoteInstrumentId),
            orderBy: desc(InstrumentDailyMarketPriceEntityTable.priceDate)
        });
    }

    async findForDateOrBefore(
        instrumentId: number,
        quoteInstrumentId: number,
        priceDate: string,
        tx?: DB
    ): Promise<InstrumentDailyMarketPriceEntityInterface | undefined> {
        return await (tx ?? this.db).query.InstrumentDailyMarketPriceEntityTable.findFirst({
            where: this.buildInstrumentQuoteDateCondition(instrumentId, quoteInstrumentId, priceDate),
            orderBy: desc(InstrumentDailyMarketPriceEntityTable.priceDate)
        });
    }

    findRecent(instrumentId: number, quoteInstrumentId: number, limit: number, tx?: DB) {
        return (tx ?? this.db).query.InstrumentDailyMarketPriceEntityTable.findMany({
            where: this.buildInstrumentQuoteCondition(instrumentId, quoteInstrumentId),
            orderBy: desc(InstrumentDailyMarketPriceEntityTable.priceDate),
            limit
        });
    }

    countByInstrumentAndQuote(instrumentId: number, quoteInstrumentId: number, tx?: DB) {
        return (tx ?? this.db)
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
