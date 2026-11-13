import { and, eq, inArray, isNull, ne, or, sql } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { Db } from '../../@generic/service/db.service';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { TransactionUpdatedByEnum } from '../enum/transaction-updated-by.enum';
import { YieldKindEnum } from '../enum/yield-kind.enum';
import { TransactionEntityTable } from '../table/transaction-entity.table';

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
                ).pipe(Effect.map(([row]) => row.zoneCount === 1)),
            refineImportedYieldKind: (transactionId: number, yieldKind: YieldKindEnum) =>
                Db.query(db =>
                    db
                        .update(TransactionEntityTable)
                        .set({ yieldKind, updatedAt: new Date() })
                        .where(
                            and(
                                eq(TransactionEntityTable.id, transactionId),
                                or(
                                    isNull(TransactionEntityTable.yieldKind),
                                    eq(TransactionEntityTable.yieldKind, YieldKindEnum.DISTRIBUTION)
                                ),
                                or(
                                    isNull(TransactionEntityTable.updatedBy),
                                    ne(TransactionEntityTable.updatedBy, TransactionUpdatedByEnum.USER)
                                )
                            )
                        )
                )
        }))
    }
) {
    static readonly layer = Layer.effect(TransactionYieldRepository, TransactionYieldRepository.make);
}
