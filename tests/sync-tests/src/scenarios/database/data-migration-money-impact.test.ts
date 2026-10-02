import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { AccountDebtOpeningService } from '@app/account/service/account-debt-opening.service';
import { AccountBalanceRepository, AccountDebtTypeEnum, AccountTypeEnum, PRECISION, UserIconNameEnum } from '@budgie/contracts';
import { AccountBalanceIncrementalService } from '@budgie/ledger';
import { TransferConsolidationService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { isNotEmptyArray } from '@rnw-community/shared';

import { applyMigration, seed, seedBankPair, testDb, TestLayer } from '../../harness';

const MIGRATIONS_FOLDER = resolve(process.cwd(), '../../packages/app/drizzle');
const DATA_CHANGE_PATTERN = /\b(?:UPDATE\s+\S+\s+SET|INSERT(?:\s+OR\s+\w+)?\s+INTO|DELETE\s+FROM)\b/iu;
const OPERATED_AT = new Date(2025, 5, 1, 12, 0, 0);

const seedLedgerFixture = Effect.fnUntraced(function* () {
    const accountDebtOpeningService = yield* AccountDebtOpeningService;
    const bankAccount = yield* seed.account({ externalId: 'mono-bank', type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 });
    const cashAccount = yield* seed.account({ title: 'Cash', type: AccountTypeEnum.CASH, instrumentId: 1 });
    const historicalAtm = yield* seedBankPair.expense(
        { externalId: 'tx-atm', operatedAt: OPERATED_AT },
        { accountId: bankAccount.id, amount: 408 * PRECISION }
    );

    yield* seedBankPair.expense(
        { externalId: 'tx-groceries', operatedAt: OPERATED_AT },
        { accountId: bankAccount.id, amount: 37 * PRECISION }
    );
    yield* seedBankPair.income(
        { externalId: 'tx-salary', operatedAt: OPERATED_AT },
        { accountId: bankAccount.id, amount: 2_100 * PRECISION }
    );
    yield* seed.directTransfer({
        exchangeRate: 1,
        operatedAt: OPERATED_AT,
        sourceAccountId: bankAccount.id,
        sourceAmount: 150 * PRECISION,
        sourceEntryExchangeRate: 1,
        targetAccountId: cashAccount.id,
        targetAmount: 150 * PRECISION,
        toIban: null
    });
    yield* testDb.$client.unsafe(`UPDATE transactions SET title = 'Банкомат Erste Bank' WHERE id = ${historicalAtm.id}`);
    yield* testDb.$client.unsafe(
        `UPDATE transaction_entries SET created_at = (SELECT MIN(created_at) FROM mcc_categories) - 86400 WHERE transaction_id = ${historicalAtm.id}`
    );
    const debtAccount = yield* accountDebtOpeningService.openDebtWithFundingAccount(
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
});

const dataMigrations = readdirSync(MIGRATIONS_FOLDER, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .filter(migrationName => !migrationName.endsWith('_baseline'))
    .filter(migrationName => DATA_CHANGE_PATTERN.test(readFileSync(resolve(MIGRATIONS_FOLDER, migrationName, 'migration.sql'), 'utf8')));

describe.runIf(isNotEmptyArray(dataMigrations))('database/data-migration-money-impact', () => {
    it.effect.each(dataMigrations)('%s leaves every ledger balance unchanged after consolidation', migrationName =>
        Effect.gen(function* () {
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
            const transferConsolidationService = yield* TransferConsolidationService;
            const accountIds = yield* seedLedgerFixture();
            yield* transferConsolidationService.consolidate(null);
            const ledgerBefore = yield* accountBalanceRepository.getLedgerBalances(accountIds);

            yield* applyMigration(migrationName);
            yield* transferConsolidationService.consolidate(null);
            yield* accountBalanceIncrementalService.updateAllBalances(false);

            expect(yield* accountBalanceRepository.getLedgerBalances(accountIds)).toEqual(ledgerBefore);
        }).pipe(Effect.provide(TestLayer))
    );
});
