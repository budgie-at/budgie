import { and, eq, isNull, sql } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isNotEmptyArray } from '@rnw-community/shared';

import { Db } from '../../@generic/service/db.service';
import { ExchangeRateEntityTable } from '../table/exchange-rate-entity.table';

import type { ExchangeRateCreateEntityInterface } from '../entity/exchange-rate-create-entity.interface';

export class ExchangeRateRepository extends Context.Service<ExchangeRateRepository>()('@budgie/contracts/ExchangeRateRepository', {
    make: Effect.succeed({
        bulkUpsert: Effect.fn('ExchangeRateRepository.bulkUpsert')(function* (inputs: ExchangeRateCreateEntityInterface[]) {
            if (!isNotEmptyArray(inputs)) {
                return;
            }

            yield* Db.query(db =>
                db
                    .insert(ExchangeRateEntityTable)
                    .values(inputs)
                    .onConflictDoUpdate({
                        target: [ExchangeRateEntityTable.baseInstrumentId, ExchangeRateEntityTable.quoteInstrumentId],
                        set: {
                            rate: sql`excluded.rate`,
                            source: sql`excluded.source`,
                            updatedAt: new Date()
                        }
                    })
            );
        }),
        upsert: (baseInstrumentId: number, quoteInstrumentId: number, rate: number, source: string) =>
            Db.query(db =>
                db
                    .insert(ExchangeRateEntityTable)
                    .values({ baseInstrumentId, quoteInstrumentId, rate, source })
                    .onConflictDoUpdate({
                        target: [ExchangeRateEntityTable.baseInstrumentId, ExchangeRateEntityTable.quoteInstrumentId],
                        set: { rate, source }
                    })
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
                    where: and(
                        eq(ExchangeRateEntityTable.baseInstrumentId, baseInstrumentId),
                        eq(ExchangeRateEntityTable.quoteInstrumentId, quoteInstrumentId)
                    )
                })
            )
    })
}) {
    static readonly layer = Layer.effect(ExchangeRateRepository, ExchangeRateRepository.make);
}
