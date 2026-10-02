import { Db, ExchangeRateEntityTable } from '@budgie/contracts';
import { isNull, sql } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { bulkUpsert } from '../../@generic/util/bulk-upsert.util';

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
            )
    })
}) {
    static readonly layer = Layer.effect(ExchangeRateRepository, ExchangeRateRepository.make);
}
