import { Db } from '@budgie/contracts';
import { formatToMillis } from 'drizzle-orm/migrator.utils';
import { migrate } from 'drizzle-orm/sqlite-core/effect';
import * as Context from 'effect/Context';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import { DatabaseOpenError } from '../error/database-open.error';
import { isSupportedMigrationCreatedAt } from '../utils/is-supported-migration-created-at.util';
import { readLastMigrationCreatedAt } from '../utils/read-last-migration-created-at.util';

import type { MigrationMeta } from 'drizzle-orm/migrator';
import type * as SqlClient from 'effect/sql/SqlClient';

export class DatabaseMigrationService extends Context.Service<DatabaseMigrationService>()('@budgie/app/DatabaseMigrationService', {
    make: Effect.sync(() => {
        const recordBaselineOnLatestLegacyDatabase = Effect.fn('DatabaseMigrationService.recordBaselineOnLatestLegacyDatabase')(function* (
            client: SqlClient.SqlClient,
            baselineMigration: MigrationMeta
        ) {
            const lastCreatedAt = yield* readLastMigrationCreatedAt(client);

            if (!isDefined(lastCreatedAt) || lastCreatedAt >= baselineMigration.folderMillis) {
                return;
            }

            if (!isSupportedMigrationCreatedAt(lastCreatedAt)) {
                return yield* DatabaseOpenError.make({ cause: 'The database predates the migration baseline' });
            }

            const migrationsTable = client('__drizzle_migrations');

            yield* client.withTransaction(
                Effect.gen(function* () {
                    const now = yield* DateTime.now;
                    const appliedAt = DateTime.formatIso(now);

                    yield* client`ALTER TABLE ${migrationsTable} ADD COLUMN name text`;
                    yield* client`ALTER TABLE ${migrationsTable} ADD COLUMN applied_at TEXT`;
                    yield* client`INSERT INTO ${migrationsTable} (hash, created_at, name, applied_at) VALUES (${baselineMigration.hash}, ${baselineMigration.folderMillis}, ${baselineMigration.name}, ${appliedAt})`;
                })
            );
        });

        return {
            migrate: Effect.fn('DatabaseMigrationService.migrate')(function* () {
                const db = yield* Db;
                const { default: bundledMigrations } = yield* Effect.promise(() => import('../../../../drizzle/migrations'));
                const migrations: Readonly<Record<string, () => string[]>> = bundledMigrations.migrations;
                const localMigrations: MigrationMeta[] = Object.keys(migrations)
                    .sort()
                    .map(name => ({
                        name,
                        get sql() {
                            return migrations[name]();
                        },
                        bps: true,
                        folderMillis: formatToMillis(name.slice(0, 14)),
                        hash: ''
                    }));
                const [baselineMigration] = localMigrations;

                yield* recordBaselineOnLatestLegacyDatabase(db.$client, baselineMigration);
                yield* migrate(localMigrations, db.$primary._.session);
            })
        };
    })
}) {
    static readonly layer = Layer.effect(DatabaseMigrationService, DatabaseMigrationService.make);
}
