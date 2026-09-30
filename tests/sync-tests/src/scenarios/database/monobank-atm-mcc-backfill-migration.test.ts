import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';
import { AccountTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import {
    applyMigration,
    expectAtmCashWithdrawalConsolidation,
    fetchExpenseEntries,
    findMccByCode,
    seed,
    seedBankPair,
    testDb,
    run
} from '../../harness';

const MIGRATION_FILE_NAME = '0065_backfill_monobank_atm_mcc.sql';
const AMOUNT = 408_000_000;
const OPERATED_AT = new Date(Date.now() - 24 * 60 * 60 * 1000);

describe('database/monobank-atm-mcc-backfill-migration', () => {
    it('restores MCC 6011 on Monobank ATM withdrawals imported without an MCC so consolidation converts them once', async () => {
        const bankAccount = seed.account({ externalId: 'mono-bank', type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 });
        const cashAccount = seed.account({ title: 'Cash', type: AccountTypeEnum.CASH, instrumentId: 1 });
        const atmExpense = seedBankPair.expense(
            { externalId: 'tx-atm', operatedAt: OPERATED_AT },
            { accountId: bankAccount.id, amount: AMOUNT }
        );
        const shopExpense = seedBankPair.expense(
            { externalId: 'tx-shop', operatedAt: OPERATED_AT },
            { accountId: bankAccount.id, amount: AMOUNT }
        );
        await testDb.$client.execAsync(`UPDATE transactions SET title = 'Банкомат Erste Bank' WHERE id = ${atmExpense.id}`);

        await applyMigration(MIGRATION_FILE_NAME);
        await applyMigration(MIGRATION_FILE_NAME);

        const [atmEntry] = await fetchExpenseEntries(atmExpense.id);
        const [shopEntry] = await fetchExpenseEntries(shopExpense.id);
        expect(atmEntry.mccCategoryId).toBe(findMccByCode('6011').id);
        expect(shopEntry.mccCategoryId).toBeNull();

        await expectAtmCashWithdrawalConsolidation(bankAccount.id, cashAccount.id, atmExpense.id);
        expect(await run(transferConsolidationService.consolidate(null))).toMatchObject({ consolidated: 0, found: 0 });
    });
});
