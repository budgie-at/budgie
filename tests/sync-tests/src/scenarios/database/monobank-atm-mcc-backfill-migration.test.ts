import { TransferConsolidationService } from '@app/sync/service/transfer-consolidation.service';
import { AccountTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    applyMigration,
    expectAtmCashWithdrawalConsolidation,
    fetchExpenseEntries,
    findMccByCode,
    seed,
    seedBankPair,
    testDb,
    TestLayer
} from '../../harness';

const MIGRATION_FILE_NAME = '0065_backfill_monobank_atm_mcc.sql';
const AMOUNT = 408_000_000;
const OPERATED_AT = new Date(Date.now() - 24 * 60 * 60 * 1000);

describe('database/monobank-atm-mcc-backfill-migration', () => {
    it.effect('restores MCC 6011 on Monobank ATM withdrawals imported without an MCC so consolidation converts them once', () =>
        Effect.gen(function* () {
            const transferConsolidationService = yield* TransferConsolidationService;
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
            yield* Effect.promise(() =>
                testDb.$client.execAsync(`UPDATE transactions SET title = 'Банкомат Erste Bank' WHERE id = ${atmExpense.id}`)
            );

            yield* applyMigration(MIGRATION_FILE_NAME);
            yield* applyMigration(MIGRATION_FILE_NAME);

            const [atmEntry] = fetchExpenseEntries(atmExpense.id);
            const [shopEntry] = fetchExpenseEntries(shopExpense.id);
            expect(atmEntry.mccCategoryId).toBe(findMccByCode('6011').id);
            expect(shopEntry.mccCategoryId).toBeNull();

            yield* expectAtmCashWithdrawalConsolidation(bankAccount.id, cashAccount.id, atmExpense.id);
            expect(yield* transferConsolidationService.consolidate(null)).toMatchObject({ consolidated: 0, found: 0 });
        }).pipe(Effect.provide(TestLayer))
    );
});
