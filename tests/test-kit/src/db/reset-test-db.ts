import * as Effect from 'effect/Effect';

import type { DB } from '@budgie/contracts';

const MUTABLE_TABLES = [
    'accounts',
    'account_balances',
    'debt_events',
    'transactions',
    'transaction_entries',
    'transaction_tags',
    'tags',
    'rule_actions',
    'rule_conditions',
    'rules',
    'bank_syncs',
    'bank_integrations',
    'exchange_rates',
    'merchant_embeddings',
    'merchant_embedding_tags',
    'comment_embeddings',
    'comment_embedding_tags'
] as const;

export const resetTestDb = (database: DB) =>
    Effect.forEach(
        [
            'PRAGMA foreign_keys = OFF',
            ...MUTABLE_TABLES.map(tableName => `DELETE FROM "${tableName}"`),
            "DELETE FROM sqlite_sequence WHERE name NOT IN ('instruments', 'mcc_groups', 'mcc_categories', 'categories', 'settings')",
            'PRAGMA foreign_keys = ON'
        ],
        statement => database.$client.unsafe(statement).raw,
        { discard: true }
    );
