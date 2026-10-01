/* oxlint-disable lingui/no-unlocalized-strings */
import { Db } from '@budgie/contracts';
import { formatToMillis } from 'drizzle-orm/migrator.utils';
import { migrate } from 'drizzle-orm/sqlite-core/effect';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';

import { isDefined, isEmptyArray } from '@rnw-community/shared';

import bundledMigrations from '../../../../drizzle/migrations';

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

            const pendingNamesBySecond = new Map<number, string[]>();

            localMigrations.forEach(migration => {
                pendingNamesBySecond.set(migration.folderMillis, [
                    ...(pendingNamesBySecond.get(migration.folderMillis) ?? []),
                    migration.name
                ]);
            });

            yield* client.withTransaction(
                Effect.gen(function* () {
                    yield* client`ALTER TABLE ${client(migrationsTableName)} ADD COLUMN name text`;
                    yield* client`ALTER TABLE ${client(migrationsTableName)} ADD COLUMN applied_at TEXT`;

                    const rows = yield* client<{
                        readonly id: number;
                        readonly createdAt: number;
                    }>`SELECT id, created_at AS createdAt FROM ${client(migrationsTableName)} ORDER BY created_at, id`;

                    yield* Effect.forEach(
                        rows,
                        row => {
                            const name = pendingNamesBySecond.get(Math.floor(row.createdAt / 1000) * 1000)?.shift();

                            return isDefined(name)
                                ? client`UPDATE ${client(migrationsTableName)} SET name = ${name} WHERE id = ${row.id}`
                                : Effect.die(new Error(`Applied migration ${row.id} created at ${row.createdAt} has no local migration`));
                        },
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
