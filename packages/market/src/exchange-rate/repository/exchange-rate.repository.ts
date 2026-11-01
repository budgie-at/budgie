import {
    AccountEntityTable,
    CRYPTO_ACCOUNT_TYPES,
    Db,
    ExchangeRateEntityTable,
    getExchangeRateWithHistoricalFallbackSql
} from '@budgie/contracts';
import { and, inArray, isNull, sql } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { bulkUpsert } from '../../@generic/utils/bulk-upsert.util';

import type { ExchangeRateCreateEntityInterface } from '@budgie/contracts';

export class ExchangeRateRepository extends Context.Service<ExchangeRateRepository>()('@budgie/market/ExchangeRateRepository', {
    make: Effect.sync(() => {
        const outerInstrumentId = sql`${AccountEntityTable}.${sql.identifier(AccountEntityTable.instrumentId.name)}`;

        return {
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
                            rate: sql<number | null>`${getExchangeRateWithHistoricalFallbackSql(quoteInstrumentId, outerInstrumentId)}`
                        })
                        .from(AccountEntityTable)
                        .where(and(inArray(AccountEntityTable.type, CRYPTO_ACCOUNT_TYPES), isNull(AccountEntityTable.deletedAt)))
                )
        };
    })
}) {
    static readonly layer = Layer.effect(ExchangeRateRepository, ExchangeRateRepository.make);
}
