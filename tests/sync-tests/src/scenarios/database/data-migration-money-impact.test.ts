import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { accountBalanceRepository } from '@app/@generic/drizzle/db/db';
import { accountBalanceIncrementalService } from '@app/account/service/account-balance-incremental.service';
import { accountDebtOpeningService } from '@app/account/service/account-debt-opening.service';
import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';
import { AccountDebtTypeEnum, AccountTypeEnum, PRECISION, UserIconNameEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { isDefined } from '@rnw-community/shared';

import { applyMigration, seed, seedBankPair, testDb } from '../../harness';

const MIGRATIONS_FOLDER = resolve(process.cwd(), '../../packages/app/drizzle');
const DATA_CHANGE_PATTERN = /\b(?:UPDATE\s+\S+\s+SET|INSERT\s+INTO|DELETE\s+FROM)\b/iu;
const OPERATED_AT = new Date(2025, 5, 1, 12, 0, 0);
const EXISTING_COLUMNS = 'adds columns the migrated test schema already has';
const EXISTING_TABLES = 'creates tables or reference rows the migrated test schema already has';
const UNREPLAYABLE_MIGRATIONS = new Map([
    ['0000_normal_dragon_man.sql', EXISTING_TABLES],
    ['0004_cloudy_juggernaut.sql', EXISTING_TABLES],
    ['0005_omniscient_jasper_sitwell.sql', EXISTING_COLUMNS],
    ['0011_windy_lyja.sql', 'rewrites title_embeddings, which a later migration dropped'],
    ['0016_add_needs_embedding.sql', EXISTING_COLUMNS],
    ['0018_add_transaction_tags_is_primary.sql', EXISTING_COLUMNS],
    ['0023_add_mcc_default_category.sql', EXISTING_COLUMNS],
    ['0024_default_category_translations.sql', EXISTING_TABLES],
    ['0028_add_crypto_instruments.sql', EXISTING_COLUMNS],
    ['0033_add_transaction_entry_kind.sql', EXISTING_COLUMNS],
    ['0034_add_debt_target_base_valuation.sql', EXISTING_COLUMNS],
    ['0035_add_debt_events.sql', EXISTING_TABLES],
    ['0039_add_bank_integrations.sql', EXISTING_TABLES],
    ['0040_drop_bank_syncs_token.sql', 'reads bank_syncs.token, which it drops']
]);
const REVERTED_BY_MIGRATIONS = new Map([['0065_backfill_monobank_atm_mcc.sql', '0067_revert_backfilled_atm_consolidations.sql']]);

const seedLedgerFixture = async (): Promise<number[]> => {
    const bankAccount = seed.account({ externalId: 'mono-bank', type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 });
    const cashAccount = seed.account({ title: 'Cash', type: AccountTypeEnum.CASH, instrumentId: 1 });
    const historicalAtm = seedBankPair.expense(
        { externalId: 'tx-atm', operatedAt: OPERATED_AT },
        { accountId: bankAccount.id, amount: 408 * PRECISION }
    );

    seedBankPair.expense({ externalId: 'tx-groceries', operatedAt: OPERATED_AT }, { accountId: bankAccount.id, amount: 37 * PRECISION });
    seedBankPair.income({ externalId: 'tx-salary', operatedAt: OPERATED_AT }, { accountId: bankAccount.id, amount: 2_100 * PRECISION });
    seed.directTransfer({
        exchangeRate: 1,
        operatedAt: OPERATED_AT,
        sourceAccountId: bankAccount.id,
        sourceAmount: 150 * PRECISION,
        sourceEntryExchangeRate: 1,
        targetAccountId: cashAccount.id,
        targetAmount: 150 * PRECISION,
        toIban: null
    });
    await testDb.$client.execAsync(`UPDATE transactions SET title = 'Банкомат Erste Bank' WHERE id = ${historicalAtm.id}`);
    await testDb.$client.execAsync(
        `UPDATE transaction_entries SET created_at = (SELECT MIN(created_at) FROM mcc_categories) - 86400 WHERE transaction_id = ${historicalAtm.id}`
    );
    const debtAccount = await accountDebtOpeningService.openDebtWithFundingAccount(
        {
            title: 'Alex owes me',
            iban: null,
            icon: UserIconNameEnum.HandCoins,
            instrumentId: 1,
            type: AccountTypeEnum.DEBT,
            debtType: AccountDebtTypeEnum.LENT,
            currentBalance: 0,
            targetBalance: 90,
            contactId: null,
            deadline: null
        },
        bankAccount.id
    );

    return [bankAccount.id, cashAccount.id, debtAccount.id];
};

const applyAndConsolidate = async (fileName: string): Promise<void> => {
    await applyMigration(fileName);
    await transferConsolidationService.consolidate();
};

const dataMigrations = readdirSync(MIGRATIONS_FOLDER)
    .filter(fileName => fileName.endsWith('.sql') && !UNREPLAYABLE_MIGRATIONS.has(fileName))
    .filter(fileName => DATA_CHANGE_PATTERN.test(readFileSync(resolve(MIGRATIONS_FOLDER, fileName), 'utf8')));

describe('database/data-migration-money-impact', () => {
    it.each(dataMigrations)('%s leaves every ledger balance unchanged after consolidation', async fileName => {
        const accountIds = await seedLedgerFixture();
        await transferConsolidationService.consolidate();
        const ledgerBefore = await accountBalanceRepository.getLedgerBalances(accountIds);

        await applyAndConsolidate(fileName);
        const revertingMigration = REVERTED_BY_MIGRATIONS.get(fileName);
        if (isDefined(revertingMigration)) {
            await applyAndConsolidate(revertingMigration);
        }
        await accountBalanceIncrementalService.updateAllBalances(false);

        expect(await accountBalanceRepository.getLedgerBalances(accountIds)).toEqual(ledgerBefore);
    });
});
