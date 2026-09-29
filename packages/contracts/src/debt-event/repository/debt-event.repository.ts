import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { isNotEmptyArray } from '@rnw-community/shared';

import { Db } from '../../@generic/service/db.service';
import { DebtEventDirectionEnum } from '../enum/debt-event-direction.enum';
import { DebtEventSourceEnum } from '../enum/debt-event-source.enum';
import { DebtEventEntityTable } from '../table/debt-event-entity.table';

import type { DB } from '../../@generic/type/db.type';
import type { DebtEventCreateEntityInterface } from '../entity/debt-event-create-entity.interface';

export class DebtEventRepository {
    readonly create = Effect.fn('DebtEventRepository.create')(function* (this: DebtEventRepository, input: DebtEventCreateEntityInterface) {
        const [debtEvent] = yield* this.bulkCreate([input]);

        return debtEvent;
    });

    readonly bulkCreate = Effect.fn('DebtEventRepository.bulkCreate')(function* (inputs: DebtEventCreateEntityInterface[]) {
        if (!isNotEmptyArray(inputs)) {
            return [];
        }

        return yield* Db.query(db => db.insert(DebtEventEntityTable).values(inputs).returning());
    });

    readonly findByTransactionId = Effect.fn('DebtEventRepository.findByTransactionId')(function* (transactionId: number) {
        const debtEvents = yield* Db.query(db =>
            db
                .select()
                .from(DebtEventEntityTable)
                .where(and(eq(DebtEventEntityTable.transactionId, transactionId), isNull(DebtEventEntityTable.deletedAt)))
                .limit(1)
        );

        return debtEvents.at(0);
    });

    readonly findByAccountId = Effect.fn('DebtEventRepository.findByAccountId')(function* (accountId: number) {
        return yield* Db.query(db =>
            db.query.DebtEventEntityTable.findMany({
                where: and(eq(DebtEventEntityTable.debtAccountId, accountId), isNull(DebtEventEntityTable.deletedAt))
            })
        );
    });

    readonly findByAccountIdAndSource = Effect.fn('DebtEventRepository.findByAccountIdAndSource')(function* (
        accountId: number,
        source: DebtEventSourceEnum
    ) {
        return yield* Db.query(db =>
            db.query.DebtEventEntityTable.findMany({
                where: and(
                    eq(DebtEventEntityTable.debtAccountId, accountId),
                    eq(DebtEventEntityTable.source, source),
                    isNull(DebtEventEntityTable.deletedAt)
                )
            })
        );
    });

    readonly updateById = Effect.fn('DebtEventRepository.updateById')(function* (
        id: number,
        input: Partial<
            Pick<
                DebtEventCreateEntityInterface,
                'transactionEntryId' | 'direction' | 'amount' | 'baseInstrumentId' | 'baseExchangeRate' | 'baseAmount' | 'operatedAt'
            >
        >
    ) {
        yield* Db.query(db =>
            db
                .update(DebtEventEntityTable)
                .set({ ...input, updatedAt: new Date() })
                .where(eq(DebtEventEntityTable.id, id))
        );
    });

    readonly deleteByIds = Effect.fn('DebtEventRepository.deleteByIds')(function* (ids: number[]) {
        if (!isNotEmptyArray(ids)) {
            return;
        }

        yield* Db.query(db => db.delete(DebtEventEntityTable).where(inArray(DebtEventEntityTable.id, ids)));
    });

    readonly deleteByTransactionId = Effect.fn('DebtEventRepository.deleteByTransactionId')(function* (transactionId: number) {
        yield* Db.query(db => db.delete(DebtEventEntityTable).where(eq(DebtEventEntityTable.transactionId, transactionId)));
    });

    readonly deleteByAccountIdAndSource = Effect.fn('DebtEventRepository.deleteByAccountIdAndSource')(function* (
        accountId: number,
        source: DebtEventSourceEnum
    ) {
        yield* Db.query(db =>
            db
                .delete(DebtEventEntityTable)
                .where(and(eq(DebtEventEntityTable.debtAccountId, accountId), eq(DebtEventEntityTable.source, source)))
        );
    });

    readonly deleteByAccountId = Effect.fn('DebtEventRepository.deleteByAccountId')(function* (accountId: number) {
        yield* Db.query(db => db.delete(DebtEventEntityTable).where(eq(DebtEventEntityTable.debtAccountId, accountId)));
    });

    readonly archiveByAccountIds = Effect.fn('DebtEventRepository.archiveByAccountIds')(function* (accountIds: number[]) {
        if (!isNotEmptyArray(accountIds)) {
            return;
        }

        yield* Db.query(db =>
            db
                .update(DebtEventEntityTable)
                .set({ deletedAt: new Date() })
                .where(and(inArray(DebtEventEntityTable.debtAccountId, accountIds), isNull(DebtEventEntityTable.deletedAt)))
        );
    });

    readonly restoreByAccountIds = Effect.fn('DebtEventRepository.restoreByAccountIds')(function* (accountIds: number[]) {
        if (!isNotEmptyArray(accountIds)) {
            return;
        }

        yield* Db.query(db =>
            db.update(DebtEventEntityTable).set({ deletedAt: null }).where(inArray(DebtEventEntityTable.debtAccountId, accountIds))
        );
    });

    readonly truncate = Effect.fn('DebtEventRepository.truncate')(function* () {
        yield* Db.query(db => db.delete(DebtEventEntityTable));
    });

    constructor(private db: DB) {}

    getManualSettledAmountByAccountId(accountId: number) {
        return this.db
            .select({ amount: sql<number>`COALESCE(SUM(${DebtEventEntityTable.amount}), 0)`.mapWith(Number) })
            .from(DebtEventEntityTable)
            .where(
                and(
                    eq(DebtEventEntityTable.debtAccountId, accountId),
                    eq(DebtEventEntityTable.source, DebtEventSourceEnum.MANUAL),
                    eq(DebtEventEntityTable.direction, DebtEventDirectionEnum.CLOSE),
                    isNull(DebtEventEntityTable.deletedAt)
                )
            );
    }
}
