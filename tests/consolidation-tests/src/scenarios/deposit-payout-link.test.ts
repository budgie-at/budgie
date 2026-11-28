import {
    AccountBalanceRepository,
    AccountTypeEnum,
    ExternalSourceEnum,
    PRECISION,
    TransactionRepository,
    TransactionTypeEnum,
    YieldKindEnum
} from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { expectSecondConsolidationRunStable, runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService, TestLayer } from '../harness/test-context';

const PRINCIPAL = 2000 * PRECISION;
const INTEREST = 0.39 * PRECISION;

layer(TestLayer)('consolidation/deposit-payout-link', it => {
    it.effect('turns a synced deposit payout into a transfer from the manual deposit and keeps only interest as income', () =>
        Effect.gen(function* () {
            const card = yield* testSeedService.bankSyncAccount('Monobank Black •4321', ExternalSourceEnum.MONOBANK, null);
            const deposit = yield* testSeedService.account({ type: AccountTypeEnum.DEPOSIT, title: 'Term deposit' });

            yield* testSeedService.directTransfer({
                exchangeRate: 1,
                operatedAt: new Date(2026, 7, 8, 10),
                sourceAccountId: card.id,
                sourceAmount: PRINCIPAL,
                sourceEntryExchangeRate: 1,
                targetAccountId: deposit.id,
                targetAmount: PRINCIPAL,
                title: 'Відкриття депозиту',
                toIban: null
            });
            const payout = yield* testSeedService.manualExpense({
                accountId: card.id,
                amount: PRINCIPAL + INTEREST,
                operatedAt: new Date(2026, 10, 12, 10),
                title: 'Виплата депозиту',
                externalId: 'mono-deposit-payout',
                externalSource: ExternalSourceEnum.MONOBANK,
                type: TransactionTypeEnum.INCOME
            });

            yield* runConsolidation();

            const converted = yield* testQueryService.fetchTransactionById(payout.id);
            const history = yield* Effect.flatMap(TransactionRepository, repository =>
                repository.findByAccountIdsWithEntries([deposit.id])
            );
            const balances = yield* Effect.flatMap(AccountBalanceRepository, repository => repository.getLedgerBalances([deposit.id]));

            expect(converted).toMatchObject({ type: TransactionTypeEnum.TRANSFER, fromAccountId: deposit.id, toAccountId: card.id });
            expect(
                history
                    .filter(transaction => transaction.yieldKind === YieldKindEnum.INTEREST)
                    .map(transaction => transaction.entries[0].amount)
            ).toEqual([INTEREST]);
            expect(balances.get(deposit.id) ?? 0).toBe(0);
            yield* expectSecondConsolidationRunStable();
        })
    );
});
