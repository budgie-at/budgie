import { AccountBalanceEntityTable, AccountBalanceRepository, AccountTypeEnum } from '@budgie/contracts';
import { AccountBalanceIncrementalService } from '@budgie/ledger';
import { describe, expect, it } from '@effect/vitest';
import { inArray } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { seed, testDb, TestLayer } from '../../harness';

const OPERATED_AT = new Date(2026, 5, 1);

const fetchStoredBalances = (accountIds: number[]) =>
    Effect.map(
        testDb
            .select({ accountId: AccountBalanceEntityTable.accountId, amount: AccountBalanceEntityTable.amount })
            .from(AccountBalanceEntityTable)
            .where(inArray(AccountBalanceEntityTable.accountId, accountIds)),
        rows => rows.toSorted((left, right) => left.accountId - right.accountId)
    );

describe('account/account-balance-multi-account-update', () => {
    it.effect('stores the same balances for a multi-account update as the full rebuild', () =>
        Effect.gen(function* () {
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
            const firstBankAccount = yield* seed.account({ type: AccountTypeEnum.BANK, instrumentId: 1 });
            const cashAccount = yield* seed.account({ type: AccountTypeEnum.CASH, instrumentId: 1 });
            const secondBankAccount = yield* seed.account({ type: AccountTypeEnum.BANK, instrumentId: 1 });
            const accountIds = [firstBankAccount.id, cashAccount.id, secondBankAccount.id];

            yield* accountBalanceRepository.upsert({ accountId: firstBankAccount.id, amount: 999 });
            yield* accountBalanceRepository.upsert({ accountId: cashAccount.id, amount: -1 });
            yield* seed.bankPairIncome(
                { externalId: 'multi-account-income-1', operatedAt: OPERATED_AT },
                { accountId: firstBankAccount.id, amount: 50_000 }
            );
            yield* seed.bankPairExpense(
                { externalId: 'multi-account-expense-1', operatedAt: OPERATED_AT },
                { accountId: firstBankAccount.id, amount: 3_000 }
            );
            yield* seed.bankPairExpense(
                { externalId: 'multi-account-expense-2', operatedAt: OPERATED_AT },
                { accountId: cashAccount.id, amount: 12_000 }
            );
            yield* seed.bankPairIncome(
                { externalId: 'multi-account-income-2', operatedAt: OPERATED_AT },
                { accountId: secondBankAccount.id, amount: 7_000 }
            );

            yield* accountBalanceIncrementalService.updateBalancesByAccountIds([...accountIds, firstBankAccount.id]);
            const incrementalBalances = yield* fetchStoredBalances(accountIds);

            yield* accountBalanceIncrementalService.updateAllBalances(true);
            const rebuiltBalances = yield* fetchStoredBalances(accountIds);

            expect(incrementalBalances).toEqual([
                { accountId: firstBankAccount.id, amount: 47_000 },
                { accountId: cashAccount.id, amount: -12_000 },
                { accountId: secondBankAccount.id, amount: 7_000 }
            ]);
            expect(rebuiltBalances).toEqual(incrementalBalances);
        }).pipe(Effect.provide(TestLayer))
    );
});
