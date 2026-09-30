import { accountBalanceRepository } from '@app/@generic/drizzle/db/db';
import { accountBalanceIncrementalService } from '@app/account/service/account-balance-incremental.service';
import { consolidationCoordinatorService } from '@app/sync/service/consolidation-coordinator.service';
import { AccountTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { findMccByCode, seed, seedBankPair, testDb, TestLayer } from '../../harness';

const AMOUNT = 500_000_000;

describe('account/balance-after-consolidation', () => {
    it.effect('keeps stored balances equal to the ledger when consolidation replaces already counted entries', () =>
        Effect.gen(function* () {
            const bankAccount = seed.account({ externalId: 'mono-bank', type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 });
            const cashAccount = seed.account({ title: 'Cash', type: AccountTypeEnum.CASH, instrumentId: 1 });
            const atmExpense = seedBankPair.expense(
                { externalId: 'tx-atm', operatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
                { accountId: bankAccount.id, amount: AMOUNT, mccCategoryId: findMccByCode('6011').id }
            );

            yield* accountBalanceIncrementalService.updateAllBalances(false);
            yield* Effect.promise(() => testDb.$client.execAsync('UPDATE account_balances SET updated_at = updated_at - 60'));
            yield* consolidationCoordinatorService.moveAtmCashWithdrawalsToCash([atmExpense.id]);
            yield* accountBalanceIncrementalService.updateAllBalances(false);

            expect(accountBalanceRepository.getByAccountId(bankAccount.id).get()?.balance).toBe(-AMOUNT);
            expect(accountBalanceRepository.getByAccountId(cashAccount.id).get()?.balance).toBe(AMOUNT);
        }).pipe(Effect.provide(TestLayer))
    );
});
