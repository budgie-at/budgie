import { inArray, sql } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { Db } from '../../@generic/service/db.service';
import { AccountEntityTable } from '../../account/table/account-entity.table';

export class TransactionYieldRepository extends Context.Service<TransactionYieldRepository>()(
    '@budgie/contracts/TransactionYieldRepository',
    {
        make: Effect.sync(() => ({
            areAccountsInSameZone: (firstAccountId: number, secondAccountId: number) =>
                Db.query(db =>
                    db
                        .select({ zoneCount: sql<number>`COUNT(DISTINCT ${AccountEntityTable.syncZone})`.mapWith(Number) })
                        .from(AccountEntityTable)
                        .where(inArray(AccountEntityTable.id, [firstAccountId, secondAccountId]))
                ).pipe(Effect.map(([row]) => row.zoneCount === 1))
        }))
    }
) {
    static readonly layer = Layer.effect(TransactionYieldRepository, TransactionYieldRepository.make);
}
