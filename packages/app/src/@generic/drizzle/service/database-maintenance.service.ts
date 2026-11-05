/* oxlint-disable lingui/no-unlocalized-strings */
import { Db } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';

export class DatabaseMaintenanceService extends Context.Service<DatabaseMaintenanceService>()('@budgie/app/DatabaseMaintenanceService', {
    make: Effect.sync(() => {
        const vectorTableNames = ['comment_embedding_vec', 'merchant_embedding_vec'];
        const vectorChunkSize = 1024;
        const minFreelistPages = 1024;
        const minFreelistRatio = 10;
        const CountRowsSchema = Schema.Array(Schema.Struct({ count: Schema.Number }));

        const readCount = Effect.fnUntraced(function* (query: string) {
            const { $primary } = yield* Db;
            const [first] = yield* Schema.decodeUnknownEffect(CountRowsSchema)(yield* $primary.$client.unsafe(query));

            return first.count;
        });

        const withFileTempStore = Effect.fnUntraced(function* <A, E, R>(effect: Effect.Effect<A, E, R>) {
            const { $primary } = yield* Db;
            const client = $primary.$client;

            yield* client.unsafe('PRAGMA temp_store = FILE').raw;

            return yield* effect.pipe(Effect.ensuring(Effect.ignore(client.unsafe('PRAGMA temp_store = MEMORY').raw)));
        });

        const compactVectorTable = Effect.fn('DatabaseMaintenanceService.compactVectorTable')(function* (tableName: string) {
            const { $primary } = yield* Db;
            const client = $primary.$client;
            const rowCount = yield* readCount(`SELECT count(*) AS count FROM ${tableName}_rowids`);
            const chunkCount = yield* readCount(`SELECT count(*) AS count FROM ${tableName}_chunks`);

            if (chunkCount <= Math.ceil(rowCount / vectorChunkSize)) {
                return;
            }

            yield* client.withTransaction(
                Effect.gen(function* () {
                    yield* client.unsafe(`CREATE TEMP TABLE ${tableName}_keep AS SELECT rowid AS id, embedding FROM ${tableName}`).raw;
                    yield* client.unsafe(`DROP TABLE ${tableName}`).raw;
                    yield* client.unsafe(`CREATE VIRTUAL TABLE ${tableName} USING vec0(embedding float[768])`).raw;
                    yield* client.unsafe(`INSERT INTO ${tableName}(rowid, embedding) SELECT id, embedding FROM ${tableName}_keep`).raw;
                    yield* client.unsafe(`DROP TABLE ${tableName}_keep`).raw;
                })
            );
        });

        const vacuumWhenFragmented = Effect.fn('DatabaseMaintenanceService.vacuumWhenFragmented')(function* () {
            const { $primary } = yield* Db;
            const pageCount = yield* readCount('SELECT page_count AS count FROM pragma_page_count');
            const freelistCount = yield* readCount('SELECT freelist_count AS count FROM pragma_freelist_count');

            if (freelistCount < minFreelistPages || freelistCount * minFreelistRatio < pageCount) {
                return;
            }

            yield* $primary.$client.unsafe('VACUUM').raw;
            yield* $primary.$client.unsafe('PRAGMA wal_checkpoint(TRUNCATE)').raw;
        });

        return {
            compact: Effect.fn('DatabaseMaintenanceService.compact')(function* () {
                const vectorExit = yield* Effect.exit(
                    withFileTempStore(Effect.forEach(vectorTableNames, compactVectorTable, { discard: true }))
                );

                yield* withFileTempStore(vacuumWhenFragmented());
                yield* vectorExit;
            })
        };
    })
}) {
    static readonly layer = Layer.effect(DatabaseMaintenanceService, DatabaseMaintenanceService.make);
}
