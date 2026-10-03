import { Db } from '@budgie/contracts';
import { formatToMillis } from 'drizzle-orm/migrator.utils';
import { migrate } from 'drizzle-orm/sqlite-core/effect';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';

import { isDefined } from '@rnw-community/shared';

import bundledMigrations from '../../../../drizzle/migrations';
import { DatabaseOpenError } from '../error/database-open.error';
import { isSupportedMigrationCreatedAt } from '../utils/is-supported-migration-created-at.util';
import { readLastMigrationCreatedAt } from '../utils/read-last-migration-created-at.util';

import type { MigrationMeta } from 'drizzle-orm/migrator';
import type * as SqlClient from 'effect/sql/SqlClient';

export class DatabaseMigrationService extends Context.Service<DatabaseMigrationService>()('@budgie/app/DatabaseMigrationService', {
    make: Effect.gen(function* () {
        const migrations = yield* Schema.decodeUnknownEffect(Schema.Struct({ migrations: Schema.Record(Schema.String, Schema.String) }))(
            bundledMigrations
        ).pipe(Effect.orDie);
        const localMigrations: MigrationMeta[] = Object.keys(migrations.migrations)
            .sort()
            .map(name => ({
                name,
                sql: migrations.migrations[name].split(/--> statement-breakpoint/u),
                bps: true,
                folderMillis: formatToMillis(name.slice(0, 14)),
                hash: ''
            }));
        const [baselineMigration] = localMigrations;

        const recordBaselineOnLatestLegacyDatabase = Effect.fn('DatabaseMigrationService.recordBaselineOnLatestLegacyDatabase')(function* (
            client: SqlClient.SqlClient
        ) {
            const lastCreatedAt = yield* readLastMigrationCreatedAt(client);

            if (!isDefined(lastCreatedAt) || lastCreatedAt >= baselineMigration.folderMillis) {
                return;
            }

            if (!isSupportedMigrationCreatedAt(lastCreatedAt)) {
                return yield* new DatabaseOpenError({ cause: 'The database predates the migration baseline' });
            }

            const migrationsTable = client('__drizzle_migrations');

            yield* client.withTransaction(
                Effect.gen(function* () {
                    yield* client`ALTER TABLE ${migrationsTable} ADD COLUMN name text`;
                    yield* client`ALTER TABLE ${migrationsTable} ADD COLUMN applied_at TEXT`;
                    yield* client`INSERT INTO ${migrationsTable} (hash, created_at, name, applied_at) VALUES (${baselineMigration.hash}, ${baselineMigration.folderMillis}, ${baselineMigration.name}, ${new Date().toISOString()})`;
                })
            );
        });

        return {
            migrate: Effect.fn('DatabaseMigrationService.migrate')(function* () {
                const db = yield* Db;

                yield* recordBaselineOnLatestLegacyDatabase(db.$client);
                yield* migrate(localMigrations, db.$primary._.session);
            })
        };
    })
}) {
    static readonly layer = Layer.effect(DatabaseMigrationService, DatabaseMigrationService.make);
}
