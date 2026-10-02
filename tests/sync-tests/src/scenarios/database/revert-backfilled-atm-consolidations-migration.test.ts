import { AccountBalanceIncrementalService } from '@app/account/service/account-balance-incremental.service';
import { CategorizeInboxCashService } from '@app/categorize-inbox/service/categorize-inbox-cash.service';
import { TransferConsolidationService } from '@app/sync/service/transfer-consolidation.service';
import { AccountBalanceRepository, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    applyMigration,
    fetchCanonicalsOfType,
    fetchExpenseEntries,
    fetchTransactionById,
    findMccByCode,
    seedBankAndCashAccounts,
    seedBankPair,
    testDb,
    TestLayer
} from '../../harness';

const AMOUNT = 408_000_000;
const OPERATED_AT = new Date(Date.now() - 24 * 60 * 60 * 1000);

describe('database/revert-backfilled-atm-consolidations-migration', () => {
    it.effect('undoes cash transfers built from ATM rows imported before the MCC seed and keeps bank-coded ATM transfers', () =>
        Effect.gen(function* () {
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
            const categorizeInboxService = yield* CategorizeInboxCashService;
            const transferConsolidationService = yield* TransferConsolidationService;
            const { bankAccount, cashAccount } = seedBankAndCashAccounts();
            const historicalAtm = seedBankPair.expense(
                { externalId: 'tx-historical-atm', operatedAt: OPERATED_AT },
                { accountId: bankAccount.id, amount: AMOUNT }
            );
            const bankCodedAtm = seedBankPair.expense(
                { externalId: 'tx-bank-coded-atm', operatedAt: OPERATED_AT },
                { accountId: bankAccount.id, amount: AMOUNT, mccCategoryId: findMccByCode('6011').id }
            );
            yield* Effect.promise(() =>
                testDb.$client.execAsync(
                    `UPDATE transactions SET title = 'Банкомат Erste Bank' WHERE id IN (${historicalAtm.id}, ${bankCodedAtm.id})`
                )
            );
            yield* Effect.promise(() =>
                testDb.$client.execAsync(
                    `UPDATE transaction_entries SET created_at = (SELECT MIN(created_at) FROM mcc_categories) - 86400 WHERE transaction_id = ${historicalAtm.id}`
                )
            );

            yield* applyMigration('0065_backfill_monobank_atm_mcc.sql');
            yield* categorizeInboxService.moveToCash([historicalAtm.id, bankCodedAtm.id]);
            expect(fetchCanonicalsOfType(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL)).toHaveLength(2);

            yield* applyMigration('0067_revert_backfilled_atm_consolidations.sql');

            const [historicalEntry] = fetchExpenseEntries(historicalAtm.id);
            expect(fetchCanonicalsOfType(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL)).toHaveLength(1);
            expect(fetchTransactionById(historicalAtm.id)?.consolidationParentTransactionId).toBeNull();
            expect(historicalEntry.originalTransactionId).toBeNull();
            expect(historicalEntry.mccCategoryId).toBeNull();
            expect(yield* transferConsolidationService.consolidate(null)).toMatchObject({ consolidated: 0 });

            yield* accountBalanceIncrementalService.updateAllBalances(false);

            expect((yield* accountBalanceRepository.getByAccountId(bankAccount.id)).at(0)?.balance).toBe(-2 * AMOUNT);
            expect((yield* accountBalanceRepository.getByAccountId(cashAccount.id)).at(0)?.balance).toBe(AMOUNT);
        }).pipe(Effect.provide(TestLayer))
    );
});
