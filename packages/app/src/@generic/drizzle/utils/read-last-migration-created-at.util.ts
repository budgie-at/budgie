import * as Effect from 'effect/Effect';

import { isEmptyArray } from '@rnw-community/shared';

import type * as SqlClient from 'effect/sql/SqlClient';

export const readLastMigrationCreatedAt = Effect.fnUntraced(function* (client: SqlClient.SqlClient) {
    const migrationsTables = yield* client`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = '__drizzle_migrations'`;

    if (isEmptyArray(migrationsTables)) {
        return null;
    }

    const [{ lastCreatedAt }] = yield* client<{
        readonly lastCreatedAt: number | null;
    }>`SELECT MAX(created_at) AS lastCreatedAt FROM __drizzle_migrations`;

    return lastCreatedAt;
});
