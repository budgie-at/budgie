import { AccountBalanceRepository, AccountTypeEnum } from '@budgie/contracts';
import { AccountBalanceIncrementalService } from '@budgie/ledger';
import { TransferConsolidationService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { seed, seedBankPair, testDb, TestLayer, testQueryService } from '../../harness';

const seedBankAndCashAccounts = () =>
    Effect.gen(function* () {
        return {
            bankAccount: yield* seed.account({ externalId: 'mono-bank', type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 }),
            cashAccount: yield* seed.account({ title: 'Cash', type: AccountTypeEnum.CASH, instrumentId: 1 })
        };
    });

const AMOUNT = 500_000_000;

describe('account/balance-after-consolidation', () => {
    it.effect('keeps stored balances equal to the ledger when consolidation replaces already counted entries', () =>
        Effect.gen(function* () {
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
            const transferConsolidationService = yield* TransferConsolidationService;
            const { bankAccount, cashAccount } = yield* seedBankAndCashAccounts();
            const atmExpense = yield* seedBankPair.expense(
                { externalId: 'tx-atm', operatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
                { accountId: bankAccount.id, amount: AMOUNT, mccCategoryId: (yield* testQueryService.findMccByCode('6011')).id }
            );

            yield* accountBalanceIncrementalService.updateAllBalances(false);
            yield* testDb.$client.unsafe('UPDATE account_balances SET updated_at = updated_at - 60');
            yield* transferConsolidationService.moveAtmCashWithdrawalsToCash([atmExpense.id]);
            yield* accountBalanceIncrementalService.updateAllBalances(false);

            expect((yield* accountBalanceRepository.getByAccountId(bankAccount.id)).at(0)?.balance).toBe(-AMOUNT);
            expect((yield* accountBalanceRepository.getByAccountId(cashAccount.id)).at(0)?.balance).toBe(AMOUNT);
        }).pipe(Effect.provide(TestLayer))
    );
});
