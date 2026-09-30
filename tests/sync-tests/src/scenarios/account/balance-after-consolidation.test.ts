import { AccountBalanceIncrementalService } from '@app/account/service/account-balance-incremental.service';
import { TransferConsolidationService } from '@app/sync/service/transfer-consolidation.service';
import { AccountBalanceRepository } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { findMccByCode, seedBankAndCashAccounts, seedBankPair, testDb, TestLayer } from '../../harness';

const AMOUNT = 500_000_000;

describe('account/balance-after-consolidation', () => {
    it.effect('keeps stored balances equal to the ledger when consolidation replaces already counted entries', () =>
        Effect.gen(function* () {
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
            const transferConsolidationService = yield* TransferConsolidationService;
            const { bankAccount, cashAccount } = seedBankAndCashAccounts();
            const atmExpense = seedBankPair.expense(
                { externalId: 'tx-atm', operatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
                { accountId: bankAccount.id, amount: AMOUNT, mccCategoryId: findMccByCode('6011').id }
            );

            yield* accountBalanceIncrementalService.updateAllBalances(false);
            yield* Effect.promise(() => testDb.$client.execAsync('UPDATE account_balances SET updated_at = updated_at - 60'));
            yield* transferConsolidationService.moveAtmCashWithdrawalsToCash([atmExpense.id]);
            yield* accountBalanceIncrementalService.updateAllBalances(false);

            expect((yield* accountBalanceRepository.getByAccountId(bankAccount.id)).at(0)?.balance).toBe(-AMOUNT);
            expect((yield* accountBalanceRepository.getByAccountId(cashAccount.id)).at(0)?.balance).toBe(AMOUNT);
        }).pipe(Effect.provide(TestLayer))
    );
});
