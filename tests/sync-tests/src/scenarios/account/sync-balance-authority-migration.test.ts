import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';

import type { MigratedSyncBalanceAuthorityRowInterface } from './interface/migrated-sync-balance-authority-row.interface';

describe('account/sync-balance-authority-migration', () => {
    it('keeps existing syncs ledger-authoritative', () => {
        const sqlite = new Database(':memory:');
        sqlite.exec(`
            CREATE TABLE bank_syncs (
                id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                account_id integer NOT NULL,
                provider text NOT NULL,
                enabled integer DEFAULT true NOT NULL,
                mode text DEFAULT 'BACKWARD' NOT NULL,
                status text DEFAULT 'IDLE' NOT NULL,
                transaction_count integer DEFAULT 0 NOT NULL,
                error_count integer DEFAULT 0 NOT NULL
            );
            INSERT INTO bank_syncs (account_id, provider, enabled, mode, status, transaction_count, error_count)
            VALUES (1, 'MONOBANK', 1, 'FORWARD', 'IDLE', 0, 0);
        `);
        const migration = readFileSync(
            resolve(process.cwd(), '../../packages/app/drizzle/0056_add_sync_balance_authority.sql'),
            'utf8'
        );
        sqlite.exec(migration.replaceAll('--> statement-breakpoint', ''));

        const row = sqlite
            .prepare<[], MigratedSyncBalanceAuthorityRowInterface>(
                `SELECT balance_authority, balance_anchor_captured_at, balance_adjustment_transaction_id, backward_batch_sequence
                 FROM bank_syncs WHERE account_id = 1`
            )
            .get();

        expect(row).toStrictEqual({
            balance_authority: 'LEDGER',
            balance_anchor_captured_at: null,
            balance_adjustment_transaction_id: null,
            backward_batch_sequence: null
        });
        sqlite.close();
    });
});
