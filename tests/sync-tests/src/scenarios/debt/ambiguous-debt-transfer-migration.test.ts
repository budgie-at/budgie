import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTestDb } from '@budgie-at/test-kit';
import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';

const scenarioDirectory = resolve(fileURLToPath(import.meta.url), '..');
const preMigrationFixturePath = resolve(scenarioDirectory, '../../../fixtures/debt-migration/pre-0033.db');
const ambiguousDebtTransactionId = Number('903001');
const ambiguousDebtAccountId = Number('903001');
const secondAmbiguousDebtAccountId = Number('903002');

const copyAmbiguousDebtTransferFixture = (temporaryDirectoryPath: string): string => {
    const fixturePath = join(temporaryDirectoryPath, 'ambiguous-debt-transfer.db');
    copyFileSync(preMigrationFixturePath, fixturePath);
    const sqlite = new Database(fixturePath);

    try {
        sqlite.exec(`
            INSERT INTO accounts (
                id, created_at, updated_at, title, type, nature, debt_type, instrument_id, target_balance, include_in_net_worth
            )
            VALUES
                (${ambiguousDebtAccountId}, 1780358400, 1780358400, 'Synthetic ambiguous borrowed debt', 'DEBT', 'LIABILITY', 'BORROW', 1, 700000000, 0),
                (${secondAmbiguousDebtAccountId}, 1780358400, 1780358400, 'Synthetic second ambiguous borrowed debt', 'DEBT', 'LIABILITY', 'BORROW', 1, 300000000, 0);

            INSERT INTO transactions (
                id, created_at, updated_at, type, title, operated_at, comment, from_account_id, to_account_id, exchange_rate
            )
            VALUES (
                ${ambiguousDebtTransactionId}, 1780358400, 1780358400, 'DEBT', 'Synthetic ambiguous legacy debt transfer',
                1780358400, '', ${ambiguousDebtAccountId}, ${secondAmbiguousDebtAccountId}, 1
            );

            INSERT INTO transaction_entries (
                id, created_at, updated_at, type, account_id, category_id, transaction_id, amount,
                category_source, exchange_rate, original_transaction_id
            )
            VALUES
                (903001, 1780358400, 1780358400, 'CREDIT', ${ambiguousDebtAccountId}, NULL, ${ambiguousDebtTransactionId}, 700000000, 'USER', 1, NULL),
                (903002, 1780358400, 1780358400, 'CREDIT', ${secondAmbiguousDebtAccountId}, NULL, ${ambiguousDebtTransactionId}, 300000000, 'USER', 1, NULL);
        `);
    } finally {
        sqlite.close();
    }

    return fixturePath;
};

describe('ambiguous debt transfer migration', () => {
    it('does not create duplicate transaction-backed events for one ambiguous legacy debt transaction', async () => {
        const temporaryDirectoryPath = mkdtempSync(join(tmpdir(), 'budgie-ambiguous-debt-transfer-'));

        try {
            const db = buildTestDb(copyAmbiguousDebtTransferFixture(temporaryDirectoryPath));

            try {
                expect(
                    await db.$client.getAllAsync<{ id: number }>(
                        'SELECT id FROM debt_events WHERE transaction_id = ? AND deleted_at IS NULL',
                        [ambiguousDebtTransactionId]
                    )
                ).toHaveLength(0);
                expect(
                    await db.$client.getAllAsync<{ id: number }>(
                        'SELECT id FROM debt_events WHERE debt_account_id IN (?, ?) AND transaction_id IS NULL AND source = ? AND direction = ? AND deleted_at IS NULL',
                        [ambiguousDebtAccountId, secondAmbiguousDebtAccountId, 'MANUAL', 'OPEN']
                    )
                ).toHaveLength(2);
                expect(
                    await db.$client.getAllAsync<{ id: number }>('SELECT id FROM transactions WHERE id = ?', [ambiguousDebtTransactionId])
                ).toHaveLength(1);
                expect(
                    await db.$client.getAllAsync<{ id: number }>('SELECT id FROM transaction_entries WHERE transaction_id = ?', [
                        ambiguousDebtTransactionId
                    ])
                ).toHaveLength(2);
                expect(
                    await db.$client.getAllAsync<{ targetBalance: number }>(
                        'SELECT target_balance AS targetBalance FROM accounts WHERE id IN (?, ?) ORDER BY id',
                        [ambiguousDebtAccountId, secondAmbiguousDebtAccountId]
                    )
                ).toStrictEqual([{ targetBalance: 700_000_000 }, { targetBalance: 300_000_000 }]);
            } finally {
                await db.$client.closeAsync();
            }
        } finally {
            rmSync(temporaryDirectoryPath, { recursive: true, force: true });
        }
    });
});
