import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { AccountBalanceRepository, AccountDebtTypeEnum, AccountTypeEnum, PRECISION, UserIconNameEnum } from '@budgie/contracts';
import { AccountDebtOpeningService, AccountBalanceIncrementalService } from '@budgie/ledger';
import { TransferConsolidationService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { isNotEmptyArray } from '@rnw-community/shared';

import { restoreSyncTriggers, seed, seedBankPair, suspendSyncTriggers, testDb, TestLayer, DEBT_OPENING_MESSAGES } from '../../harness';

const COMPACT_MIGRATION = '20261104170422_compact_rates_and_embeddings';
const RECURRING_SMART_MIGRATION = '20261105192451_recurring_smart_series';

const PRE_MIGRATION_SCHEMA: Readonly<Record<string, readonly string[]>> = {
    '20261106125437_inzhur_fund_instruments': ['DROP INDEX transactions_fund_account_idx'],
    [COMPACT_MIGRATION]: [
        'DROP TABLE historical_exchange_rates',
        `CREATE TABLE historical_exchange_rates (
            id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            created_at integer DEFAULT (unixepoch()) NOT NULL,
            updated_at integer DEFAULT (unixepoch()) NOT NULL,
            deleted_at integer,
            source_instrument_id integer NOT NULL,
            target_instrument_id integer NOT NULL,
            rate_date text NOT NULL,
            rate integer NOT NULL,
            FOREIGN KEY (source_instrument_id) REFERENCES instruments(id) ON UPDATE no action ON DELETE cascade,
            FOREIGN KEY (target_instrument_id) REFERENCES instruments(id) ON UPDATE no action ON DELETE cascade
        )`,
        'CREATE UNIQUE INDEX historical_exchange_rates_unique ON historical_exchange_rates (source_instrument_id, target_instrument_id, rate_date)',
        'CREATE INDEX historical_exchange_rates_lookup_idx ON historical_exchange_rates (source_instrument_id, target_instrument_id, rate_date DESC) WHERE deleted_at IS NULL',
        "ALTER TABLE comment_embeddings ADD embedding blob NOT NULL DEFAULT x''",
        'ALTER TABLE comment_embeddings ADD dimensions integer NOT NULL DEFAULT 0',
        "ALTER TABLE merchant_embeddings ADD embedding blob NOT NULL DEFAULT x''",
        'ALTER TABLE merchant_embeddings ADD dimensions integer NOT NULL DEFAULT 0',
        'CREATE INDEX idx_transaction_entries_transaction_id ON transaction_entries (transaction_id)',
        'CREATE INDEX idx_transaction_entries_account_id ON transaction_entries (account_id)'
    ],
    [RECURRING_SMART_MIGRATION]: ['DROP TABLE recurring_series_transaction']
};

const restorePreMigrationSchema = (migrationName: string) =>
    Effect.forEach(PRE_MIGRATION_SCHEMA[migrationName] ?? [], statement => testDb.$client.unsafe(statement).raw, { discard: true });

const replayMigration = (migrationName: string) => {
    const migrationSql = readFileSync(resolve(process.cwd(), '../../packages/app/drizzle', migrationName, 'migration.sql'), 'utf8');
    const dropAddedColumns = Array.from(
        migrationSql.matchAll(/ALTER TABLE `(\w+)` ADD `(\w+)`/gu),
        ([, table, column]) => `ALTER TABLE ${table} DROP COLUMN ${column}`
    );

    return suspendSyncTriggers.pipe(
        Effect.flatMap(syncTriggers =>
            Effect.forEach(
                [...dropAddedColumns, ...migrationSql.split('--> statement-breakpoint')],
                statement => testDb.$client.unsafe(statement).raw,
                {
                    discard: true
                }
            ).pipe(Effect.andThen(restoreSyncTriggers(syncTriggers)))
        )
    );
};

const applyMigration = (migrationName: string) =>
    restorePreMigrationSchema(migrationName).pipe(Effect.andThen(replayMigration(migrationName)));

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
        bankAccount.id,
        DEBT_OPENING_MESSAGES
    );

    return [bankAccount.id, cashAccount.id, debtAccount.id];
});

const SCHEMA_ONLY_MIGRATIONS = new Set(['20261105193657_cloud_sync_identity']);

const dataMigrations = readdirSync(MIGRATIONS_FOLDER, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .filter(migrationName => !migrationName.endsWith('_baseline') && !SCHEMA_ONLY_MIGRATIONS.has(migrationName))
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

    it.effect('the compact migration keeps exactly the live historical rates with identical values', () =>
        Effect.gen(function* () {
            yield* restorePreMigrationSchema(COMPACT_MIGRATION);
            yield* testDb.$client.unsafe(
                `INSERT INTO historical_exchange_rates (deleted_at, source_instrument_id, target_instrument_id, rate_date, rate) VALUES (NULL, 1, 2, '2031-01-01', 0.5), (1, 1, 2, '2031-01-02', 0.25)`
            ).raw;
            yield* replayMigration(COMPACT_MIGRATION);

            const rows = yield* testDb.$client.unsafe<{ rate_date: string; rate: number }>(
                `SELECT rate_date, rate FROM historical_exchange_rates WHERE rate_date >= '2031-01-01'`
            );

            expect(rows).toEqual([{ rate_date: '2031-01-01', rate: 0.5 }]);
        }).pipe(Effect.provide(TestLayer))
    );
});
