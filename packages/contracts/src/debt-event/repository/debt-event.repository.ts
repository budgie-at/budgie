import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isNotEmptyArray } from '@rnw-community/shared';

import { Db } from '../../@generic/service/db.service';
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
                    where: and(eq(DebtEventEntityTable.debtAccountId, accountId), isNull(DebtEventEntityTable.deletedAt))
                })
            ),
        findByAccountIdAndSource: (accountId: number, source: DebtEventSourceEnum) =>
            Db.query(db =>
                db.query.DebtEventEntityTable.findMany({
                    where: and(
                        eq(DebtEventEntityTable.debtAccountId, accountId),
                        eq(DebtEventEntityTable.source, source),
                        isNull(DebtEventEntityTable.deletedAt)
                    )
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
        deleteByTransactionId: (transactionId: number) =>
            Db.query(db => db.delete(DebtEventEntityTable).where(eq(DebtEventEntityTable.transactionId, transactionId))),
        deleteByAccountId: (accountId: number) =>
            Db.query(db => db.delete(DebtEventEntityTable).where(eq(DebtEventEntityTable.debtAccountId, accountId))),
        truncate: () => Db.query(db => db.delete(DebtEventEntityTable)),
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
