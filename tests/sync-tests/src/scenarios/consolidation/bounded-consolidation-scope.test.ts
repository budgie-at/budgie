import { TransferConsolidationService } from '@app/sync/service/transfer-consolidation.service';
import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { fetchCanonicalsOfType, seed, seedBankPair, TestLayer } from '../../harness';

const seedScopedTransferPair = (externalIdPrefix: string, operatedAt: Date, fromAccountId: number, toAccountId: number) =>
    Effect.gen(function* () {
        const expense = yield* seedBankPair.expense(
            { externalId: `${externalIdPrefix}-expense`, operatedAt },
            { accountId: fromAccountId, amount: 100 * PRECISION, toIban: 'UA-TO' }
        );
        const income = yield* seedBankPair.income(
            { externalId: `${externalIdPrefix}-income`, operatedAt },
            { accountId: toAccountId, amount: 100 * PRECISION }
        );

        return { expenseId: expense.id, incomeId: income.id };
    });

const seedWindowTransferPairs = () =>
    Effect.gen(function* () {
        const { fromAccount, toAccount } = yield* seed.accountPair('UA-FROM', 'UA-TO');
        const oldOperatedAt = new Date(2025, 0, 15, 12, 0, 0);
        const newOperatedAt = new Date(2026, 0, 15, 12, 0, 0);

        yield* seedScopedTransferPair('old', oldOperatedAt, fromAccount.id, toAccount.id);

        return {
            changedPair: yield* seedScopedTransferPair('new', newOperatedAt, fromAccount.id, toAccount.id),
            newOperatedAt
        };
    });

describe('consolidation/bounded-consolidation-scope', () => {
    it.effect('limits a bank-sync triggered scan to candidates inside the provided operated-at scope', () =>
        Effect.gen(function* () {
            const transferConsolidationService = yield* TransferConsolidationService;
            const { changedPair, newOperatedAt } = yield* seedWindowTransferPairs();

            const result = yield* transferConsolidationService.consolidate({
                operatedAtFrom: new Date(newOperatedAt.getTime() - 60_000),
                operatedAtTo: new Date(newOperatedAt.getTime() + 60_000),
                transactionIds: [changedPair.expenseId, changedPair.incomeId]
            });

            expect(result).toEqual({ found: 1, consolidated: 1 });
            expect(yield* fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR)).toHaveLength(1);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps settings-triggered consolidation global when no scope is provided', () =>
        Effect.gen(function* () {
            const transferConsolidationService = yield* TransferConsolidationService;
            yield* seedWindowTransferPairs();

            const result = yield* transferConsolidationService.consolidate(null);

            expect(result).toEqual({ found: 2, consolidated: 2 });
            expect(yield* fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR)).toHaveLength(2);
        }).pipe(Effect.provide(TestLayer))
    );
});
