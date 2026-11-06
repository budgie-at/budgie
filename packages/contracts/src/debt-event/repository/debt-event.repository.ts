import { and, count, eq, inArray, isNotNull, isNull, min, sql } from 'drizzle-orm';
import { QueryBuilder } from 'drizzle-orm/sqlite-core';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isNotEmptyArray } from '@rnw-community/shared';

import { transactionFilters } from '../../@generic/repository/base-transaction-filter.repository';
import { Db } from '../../@generic/service/db.service';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { DebtEventDirectionEnum } from '../enum/debt-event-direction.enum';
import { DebtEventSourceEnum } from '../enum/debt-event-source.enum';
import { DebtEventEntityTable } from '../table/debt-event-entity.table';

import type { DebtEventCreateEntityInterface } from '../entity/debt-event-create-entity.interface';

const bulkCreate = Effect.fn('DebtEventRepository.bulkCreate')(function* (inputs: DebtEventCreateEntityInterface[]) {
    if (!isNotEmptyArray(inputs)) {
        return [];
    }

    return yield* Db.query(db => db.insert(DebtEventEntityTable).values(inputs).returning());
});

const queryBuilder = new QueryBuilder();

const buildAttachmentPrimaryEntryCondition = () =>
    and(
        eq(TransactionEntryEntityTable.transactionId, DebtEventEntityTable.transactionId),
        transactionFilters.buildCategorizableEntryCondition()
    );

export class DebtEventRepository extends Context.Service<DebtEventRepository>()('@budgie/contracts/DebtEventRepository', {
    make: Effect.succeed({
        create: Effect.fn('DebtEventRepository.create')(function* (input: DebtEventCreateEntityInterface) {
            const [debtEvent] = yield* bulkCreate([input]);

            return debtEvent;
        }),
        bulkCreate,
        deleteByIds: Effect.fn('DebtEventRepository.deleteByIds')(function* (ids: number[]) {
            if (!isNotEmptyArray(ids)) {
                return;
            }

            yield* Db.query(db => db.delete(DebtEventEntityTable).where(inArray(DebtEventEntityTable.id, ids)));
        }),
        archiveByAccountIds: Effect.fn('DebtEventRepository.archiveByAccountIds')(function* (accountIds: number[]) {
            if (!isNotEmptyArray(accountIds)) {
                return;
            }

            yield* Db.query(db =>
                db
                    .update(DebtEventEntityTable)
                    .set({ deletedAt: new Date() })
                    .where(and(inArray(DebtEventEntityTable.debtAccountId, accountIds), isNull(DebtEventEntityTable.deletedAt)))
            );
        }),
        restoreByAccountIds: Effect.fn('DebtEventRepository.restoreByAccountIds')(function* (accountIds: number[]) {
            if (!isNotEmptyArray(accountIds)) {
                return;
            }

            yield* Db.query(db =>
                db.update(DebtEventEntityTable).set({ deletedAt: null }).where(inArray(DebtEventEntityTable.debtAccountId, accountIds))
            );
        }),
        findByTransactionId: (transactionId: number) =>
            Db.query(db =>
                db
                    .select()
                    .from(DebtEventEntityTable)
                    .where(and(eq(DebtEventEntityTable.transactionId, transactionId), isNull(DebtEventEntityTable.deletedAt)))
                    .limit(1)
            ).pipe(Effect.map(debtEvents => debtEvents.at(0))),
        findByAccountId: (accountId: number) =>
            Db.query(db =>
                db.query.DebtEventEntityTable.findMany({
                    where: { debtAccountId: accountId, deletedAt: { isNull: true } }
                })
            ),
        findByAccountIdAndSource: (accountId: number, source: DebtEventSourceEnum) =>
            Db.query(db =>
                db.query.DebtEventEntityTable.findMany({
                    where: { debtAccountId: accountId, source, deletedAt: { isNull: true } }
                })
            ),
        updateById: (
            id: number,
            input: Partial<
                Pick<
                    DebtEventCreateEntityInterface,
                    'transactionEntryId' | 'direction' | 'amount' | 'baseInstrumentId' | 'baseExchangeRate' | 'baseAmount' | 'operatedAt'
                >
            >
        ) =>
            Db.query(db =>
                db
                    .update(DebtEventEntityTable)
                    .set({ ...input, updatedAt: new Date() })
                    .where(eq(DebtEventEntityTable.id, id))
            ),
        moveToTransaction: (fromTransactionId: number, toTransactionId: number, transactionEntryId: number | null) =>
            Db.query(db =>
                db
                    .update(DebtEventEntityTable)
                    .set({ transactionId: toTransactionId, transactionEntryId, updatedAt: new Date() })
                    .where(and(eq(DebtEventEntityTable.transactionId, fromTransactionId), isNull(DebtEventEntityTable.deletedAt)))
            ),
        moveByTransactionEntryIds: Effect.fn('DebtEventRepository.moveByTransactionEntryIds')(function* (
            transactionEntryIds: number[],
            toTransactionId: number
        ) {
            if (!isNotEmptyArray(transactionEntryIds)) {
                return;
            }

            yield* Db.query(db =>
                db
                    .update(DebtEventEntityTable)
                    .set({ transactionId: toTransactionId, updatedAt: new Date() })
                    .where(
                        and(inArray(DebtEventEntityTable.transactionEntryId, transactionEntryIds), isNull(DebtEventEntityTable.deletedAt))
                    )
            );
        }),
        findAttachmentsByTransactionIds: Effect.fn('DebtEventRepository.findAttachmentsByTransactionIds')(function* (
            transactionIds: number[]
        ) {
            if (!isNotEmptyArray(transactionIds)) {
                return [];
            }

            return yield* Db.query(db =>
                db
                    .select({ transactionId: DebtEventEntityTable.transactionId, debtAccountId: DebtEventEntityTable.debtAccountId })
                    .from(DebtEventEntityTable)
                    .where(
                        and(
                            inArray(DebtEventEntityTable.transactionId, transactionIds),
                            eq(DebtEventEntityTable.source, DebtEventSourceEnum.INCOME_ATTACHMENT),
                            isNull(DebtEventEntityTable.deletedAt)
                        )
                    )
            );
        }),
        relinkAttachmentEntries: Db.query(db =>
            db
                .update(DebtEventEntityTable)
                .set({
                    transactionEntryId: sql`${queryBuilder
                        .select({ id: min(TransactionEntryEntityTable.id) })
                        .from(TransactionEntryEntityTable)
                        .where(buildAttachmentPrimaryEntryCondition())}`,
                    updatedAt: new Date()
                })
                .where(
                    and(
                        eq(DebtEventEntityTable.source, DebtEventSourceEnum.INCOME_ATTACHMENT),
                        isNotNull(DebtEventEntityTable.transactionId),
                        isNull(DebtEventEntityTable.transactionEntryId),
                        isNull(DebtEventEntityTable.deletedAt),
                        eq(
                            queryBuilder
                                .select({ count: count() })
                                .from(TransactionEntryEntityTable)
                                .where(buildAttachmentPrimaryEntryCondition()),
                            1
                        )
                    )
                )
        ),
        deleteByTransactionId: (transactionId: number) =>
            Db.query(db => db.delete(DebtEventEntityTable).where(eq(DebtEventEntityTable.transactionId, transactionId))),
        deleteByAccountId: (accountId: number) =>
            Db.query(db => db.delete(DebtEventEntityTable).where(eq(DebtEventEntityTable.debtAccountId, accountId))),
        truncate: Db.query(db => db.delete(DebtEventEntityTable)),
        getManualSettledAmountByAccountId: (accountId: number) =>
            Db.query(db =>
                db
                    .select({ amount: sql<number>`COALESCE(SUM(${DebtEventEntityTable.amount}), 0)`.mapWith(Number) })
                    .from(DebtEventEntityTable)
                    .where(
                        and(
                            eq(DebtEventEntityTable.debtAccountId, accountId),
                            eq(DebtEventEntityTable.source, DebtEventSourceEnum.MANUAL),
                            eq(DebtEventEntityTable.direction, DebtEventDirectionEnum.CLOSE),
                            isNull(DebtEventEntityTable.deletedAt)
                        )
                    )
            )
    })
}) {
    static readonly layer = Layer.effect(DebtEventRepository, DebtEventRepository.make);
}
