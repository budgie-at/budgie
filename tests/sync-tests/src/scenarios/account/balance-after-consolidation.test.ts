import { accountBalanceRepository } from '@app/@generic/drizzle/db/db';
import { accountBalanceIncrementalService } from '@app/account/service/account-balance-incremental.service';
import { consolidationCoordinatorService } from '@app/sync/service/consolidation-coordinator.service';
import { AccountTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { findMccByCode, seed, seedBankPair, testDb } from '../../harness';

const AMOUNT = 500_000_000;

describe('account/balance-after-consolidation', () => {
    it('keeps stored balances equal to the ledger when consolidation replaces already counted entries', async () => {
        const bankAccount = seed.account({ externalId: 'mono-bank', type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 });
        const cashAccount = seed.account({ title: 'Cash', type: AccountTypeEnum.CASH, instrumentId: 1 });
        const atmExpense = seedBankPair.expense(
            { externalId: 'tx-atm', operatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            { accountId: bankAccount.id, amount: AMOUNT, mccCategoryId: findMccByCode('6011').id }
        );

        await accountBalanceIncrementalService.updateAllBalances(false);
        await testDb.$client.execAsync('UPDATE account_balances SET updated_at = updated_at - 60');
        await consolidationCoordinatorService.moveAtmCashWithdrawalsToCash([atmExpense.id]);
        await accountBalanceIncrementalService.updateAllBalances(false);

        expect(accountBalanceRepository.getByAccountId(bankAccount.id).get()?.balance).toBe(-AMOUNT);
        expect(accountBalanceRepository.getByAccountId(cashAccount.id).get()?.balance).toBe(AMOUNT);
    });
});
