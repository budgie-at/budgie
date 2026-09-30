import { accountBalanceRepository } from '@app/@generic/drizzle/db/db';
import { accountBalanceIncrementalService } from '@app/account/service/account-balance-incremental.service';
import { categorizeInboxService } from '@app/categorize-inbox/service/categorize-inbox.service';
import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';
import { AccountTypeEnum, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import {
    applyMigration,
    fetchCanonicalsOfType,
    fetchExpenseEntries,
    fetchTransactionById,
    findMccByCode,
    seed,
    seedBankPair,
    testDb,
    run
} from '../../harness';

const AMOUNT = 408_000_000;
const OPERATED_AT = new Date(Date.now() - 24 * 60 * 60 * 1000);

describe('database/revert-backfilled-atm-consolidations-migration', () => {
    it('undoes cash transfers built from ATM rows imported before the MCC seed and keeps bank-coded ATM transfers', async () => {
        const bankAccount = seed.account({ externalId: 'mono-bank', type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 });
        const cashAccount = seed.account({ title: 'Cash', type: AccountTypeEnum.CASH, instrumentId: 1 });
        const historicalAtm = seedBankPair.expense(
            { externalId: 'tx-historical-atm', operatedAt: OPERATED_AT },
            { accountId: bankAccount.id, amount: AMOUNT }
        );
        const bankCodedAtm = seedBankPair.expense(
            { externalId: 'tx-bank-coded-atm', operatedAt: OPERATED_AT },
            { accountId: bankAccount.id, amount: AMOUNT, mccCategoryId: findMccByCode('6011').id }
        );
        await testDb.$client.execAsync(
            `UPDATE transactions SET title = 'Банкомат Erste Bank' WHERE id IN (${historicalAtm.id}, ${bankCodedAtm.id})`
        );
        await testDb.$client.execAsync(
            `UPDATE transaction_entries SET created_at = (SELECT MIN(created_at) FROM mcc_categories) - 86400 WHERE transaction_id = ${historicalAtm.id}`
        );

        await applyMigration('0065_backfill_monobank_atm_mcc.sql');
        await run(categorizeInboxService.moveToCash([historicalAtm.id, bankCodedAtm.id]));
        expect(fetchCanonicalsOfType(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL)).toHaveLength(2);

        await applyMigration('0067_revert_backfilled_atm_consolidations.sql');

        const [historicalEntry] = await fetchExpenseEntries(historicalAtm.id);
        expect(fetchCanonicalsOfType(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL)).toHaveLength(1);
        expect((await fetchTransactionById(historicalAtm.id))?.consolidationParentTransactionId).toBeNull();
        expect(historicalEntry.originalTransactionId).toBeNull();
        expect(historicalEntry.mccCategoryId).toBeNull();
        expect(await run(transferConsolidationService.consolidate(null))).toMatchObject({ consolidated: 0 });

        await run(accountBalanceIncrementalService.updateAllBalances(false));

        expect(accountBalanceRepository.getByAccountId(bankAccount.id).get()?.balance).toBe(-2 * AMOUNT);
        expect(accountBalanceRepository.getByAccountId(cashAccount.id).get()?.balance).toBe(AMOUNT);
    });
});
