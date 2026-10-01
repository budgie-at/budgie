/* oxlint-disable lingui/no-unlocalized-strings */
import { Db } from '@budgie/contracts';
import { formatToMillis } from 'drizzle-orm/migrator.utils';
import { migrate } from 'drizzle-orm/sqlite-core/effect';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';

import { isEmptyArray } from '@rnw-community/shared';

import bundledMigrations from '../../../../drizzle/migrations';
import LEGACY_MIGRATION_TIMESTAMPS from '../constant/legacy-migration-timestamps.json';

import type { MigrationMeta } from 'drizzle-orm/migrator';
import type * as SqlClient from 'effect/sql/SqlClient';

export class DatabaseMigrationService extends Context.Service<DatabaseMigrationService>()('@budgie/app/DatabaseMigrationService', {
    make: Effect.gen(function* () {
        const migrationsTableName = '__drizzle_migrations';
        const migrations = yield* Schema.decodeUnknownEffect(Schema.Struct({ migrations: Schema.Record(Schema.String, Schema.String) }))(
            bundledMigrations
        ).pipe(Effect.orDie);
        const localMigrations: MigrationMeta[] = Object.keys(migrations.migrations)
            .sort()
            .map(name => ({
                name,
                sql: migrations.migrations[name].split('--> statement-breakpoint'),
                bps: true,
                folderMillis: formatToMillis(name.slice(0, 14)),
                hash: ''
            }));

        const backfillLegacyMigrationNames = Effect.fn('DatabaseMigrationService.backfillLegacyMigrationNames')(function* (
            client: SqlClient.SqlClient
        ) {
            const columns = yield* client<{ readonly name: string }>`SELECT name FROM pragma_table_info(${migrationsTableName})`;

            if (isEmptyArray(columns) || columns.some(column => column.name === 'name')) {
                return;
            }

            yield* client.withTransaction(
                Effect.gen(function* () {
                    const migrationsTable = client(migrationsTableName);
                    const [{ lastAppliedAt }] = yield* client<{
                        readonly lastAppliedAt: number | null;
                    }>`SELECT MAX(created_at) AS lastAppliedAt FROM ${migrationsTable}`;

                    yield* client`ALTER TABLE ${migrationsTable} ADD COLUMN name text`;
                    yield* client`ALTER TABLE ${migrationsTable} ADD COLUMN applied_at TEXT`;
                    yield* Effect.forEach(
                        Object.entries(LEGACY_MIGRATION_TIMESTAMPS).filter(([, createdAt]) => createdAt <= (lastAppliedAt ?? 0)),
                        ([name, createdAt]) =>
                            client`UPDATE ${migrationsTable} SET name = ${name} WHERE created_at = ${createdAt}`.pipe(
                                Effect.andThen(
                                    client`INSERT INTO ${migrationsTable} (hash, created_at, name) SELECT '', ${createdAt}, ${name} WHERE NOT EXISTS (SELECT 1 FROM ${migrationsTable} WHERE name = ${name})`
                                )
                            ),
                        { discard: true }
                    );
                })
            );
        });

        return {
            migrate: Effect.fn('DatabaseMigrationService.migrate')(function* () {
                const db = yield* Db;

                yield* backfillLegacyMigrationNames(db.$client);
                yield* migrate(localMigrations, db.$primary._.session, migrationsTableName);
            })
        };
    })
}) {
    static readonly layer = Layer.effect(DatabaseMigrationService, DatabaseMigrationService.make);
}
