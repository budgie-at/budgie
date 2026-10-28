import {
    AccountEntityTable,
    CRYPTO_ACCOUNT_TYPES,
    Db,
    ExchangeRateEntityTable,
    InstrumentDailyMarketPriceEntityTable
} from '@budgie/contracts';
import { and, inArray, isNull, sql } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { bulkUpsert } from '../../@generic/utils/bulk-upsert.util';

import type { ExchangeRateCreateEntityInterface } from '@budgie/contracts';

export class ExchangeRateRepository extends Context.Service<ExchangeRateRepository>()('@budgie/market/ExchangeRateRepository', {
    make: Effect.succeed({
        bulkUpsert: (inputs: ExchangeRateCreateEntityInterface[]) =>
            bulkUpsert(
                ExchangeRateEntityTable,
                [ExchangeRateEntityTable.baseInstrumentId, ExchangeRateEntityTable.quoteInstrumentId],
                inputs,
                ['rate', 'source']
            ),
        getLatestUpdatedAt: () =>
            Db.query(db =>
                db
                    .select({ updatedAt: sql<Date | null>`MAX(${ExchangeRateEntityTable.updatedAt})` })
                    .from(ExchangeRateEntityTable)
                    .where(isNull(ExchangeRateEntityTable.deletedAt))
            ),
        findByBaseAndQuoteIds: (baseInstrumentId: number, quoteInstrumentId: number) =>
            Db.query(db =>
                db.query.ExchangeRateEntityTable.findFirst({
                    where: { baseInstrumentId, quoteInstrumentId }
                })
            ),
        findCryptoAccountValuationRates: (quoteInstrumentId: number) =>
            Db.query(db =>
                db
                    .selectDistinct({
                        instrumentId: AccountEntityTable.instrumentId,
                        rate: sql<
                            number | null
                        >`(SELECT ${ExchangeRateEntityTable.rate} FROM ${ExchangeRateEntityTable} WHERE ${ExchangeRateEntityTable.baseInstrumentId} = ${AccountEntityTable.instrumentId} AND ${ExchangeRateEntityTable.quoteInstrumentId} = ${quoteInstrumentId} LIMIT 1)`,
                        price: sql<
                            number | null
                        >`(SELECT ${InstrumentDailyMarketPriceEntityTable.price} FROM ${InstrumentDailyMarketPriceEntityTable} WHERE ${InstrumentDailyMarketPriceEntityTable.instrumentId} = ${AccountEntityTable.instrumentId} AND ${InstrumentDailyMarketPriceEntityTable.quoteInstrumentId} = ${quoteInstrumentId} AND ${InstrumentDailyMarketPriceEntityTable.deletedAt} IS NULL ORDER BY ${InstrumentDailyMarketPriceEntityTable.priceDate} DESC LIMIT 1)`
                    })
                    .from(AccountEntityTable)
                    .where(and(inArray(AccountEntityTable.type, CRYPTO_ACCOUNT_TYPES), isNull(AccountEntityTable.deletedAt)))
            )
    })
}) {
    static readonly layer = Layer.effect(ExchangeRateRepository, ExchangeRateRepository.make);
}
