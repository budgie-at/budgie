import { PRECISION, TransactionConsolidationTypeEnum, TransactionEntityTable, TransactionEntryEntityTable } from '@budgie/contracts';
import { and, eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { testDb } from '../scenario/setup';

import { seed } from './seed';
import { FIXED_TRANSFER_OPERATED_AT, seedTransferAtFixedDate } from './seed-transfer-at-fixed-date';

export const seedNestedTransferConsolidation = (childAccountId: number, bankAccountId: number, cashAccountId: number) =>
    Effect.gen(function* () {
        const amount = 70 * PRECISION;
        const child = yield* seedTransferAtFixedDate(childAccountId, cashAccountId, amount);
        const canonical = yield* seed.directTransfer({
            consolidationType: TransactionConsolidationTypeEnum.TRANSFER_PAIR,
            exchangeRate: 1,
            operatedAt: FIXED_TRANSFER_OPERATED_AT,
            sourceAccountId: bankAccountId,
            sourceAmount: amount,
            sourceEntryExchangeRate: 1,
            targetAccountId: cashAccountId,
            targetAmount: amount,
            toIban: null
        });

        yield* testDb
            .update(TransactionEntryEntityTable)
            .set({ transactionId: canonical.id, originalTransactionId: child.id })
            .where(and(eq(TransactionEntryEntityTable.transactionId, child.id), eq(TransactionEntryEntityTable.accountId, cashAccountId)));
        yield* testDb
            .update(TransactionEntityTable)
            .set({ consolidationParentTransactionId: canonical.id, consolidationType: TransactionConsolidationTypeEnum.TRANSFER_PAIR })
            .where(eq(TransactionEntityTable.id, child.id));

        const grandchild = yield* seed.bankPairIncome(
            { externalId: 'privat-income', operatedAt: FIXED_TRANSFER_OPERATED_AT },
            { accountId: cashAccountId, amount }
        );

        yield* testDb
            .update(TransactionEntryEntityTable)
            .set({ transactionId: child.id, originalTransactionId: grandchild.id })
            .where(eq(TransactionEntryEntityTable.transactionId, grandchild.id));
        yield* testDb
            .update(TransactionEntityTable)
            .set({ consolidationParentTransactionId: child.id })
            .where(eq(TransactionEntityTable.id, grandchild.id));

        return { canonical, child, grandchild };
    });
