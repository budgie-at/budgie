import { sql } from 'drizzle-orm';

import type { SQLWrapper } from 'drizzle-orm';

const MUTABLE_TABLES = [
    'accounts',
    'account_balances',
    'transactions',
    'transaction_entries',
    'transaction_tags',
    'tags',
    'rule_actions',
    'rule_conditions',
    'rules',
    'bank_syncs',
    'exchange_rates',
    'merchant_embeddings',
    'merchant_embedding_tags',
    'comment_embeddings',
    'comment_embedding_tags'
] as const;

interface RunnerInterface {
    readonly run: (query: string | SQLWrapper) => void;
}

export const resetTestDb = (db: RunnerInterface): void => {
    db.run(sql`PRAGMA foreign_keys = OFF`);
    for (const tableName of MUTABLE_TABLES) {
        db.run(sql.raw(`DELETE FROM "${tableName}"`));
    }
    db.run(sql`DELETE FROM sqlite_sequence WHERE name NOT IN ('instruments', 'mcc_groups', 'mcc_categories', 'categories', 'settings')`);
    db.run(sql`PRAGMA foreign_keys = ON`);
};
