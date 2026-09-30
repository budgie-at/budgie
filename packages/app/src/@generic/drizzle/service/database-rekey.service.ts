/* oxlint-disable lingui/no-unlocalized-strings */
import { Db, SettingsRepository } from '@budgie/contracts';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as Effect from 'effect/Effect';
import { File, Paths } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

import { isNotEmptyString } from '@rnw-community/shared';

import { DB_NAME } from '../constant/db-name.constant';
import { expoDb } from '../db/db';
import * as schema from '../db/schema';

import { databaseLifecycleService } from './database-lifecycle.service';
import { RekeyParamsInterface } from './interface/rekey-params.interface';
import { RekeyPathsInterface } from './interface/rekey-paths.interface';

class DatabaseRekeyService {
    readonly rekey = Effect.fn('DatabaseRekeyService.rekey')(function* (
        this: DatabaseRekeyService,
        params: RekeyParamsInterface,
        onCommit: Effect.Effect<void>
    ) {
        const paths = this.getPaths();

        yield* this.prepare(paths, params).pipe(
            Effect.andThen(this.commit(paths, onCommit).pipe(Effect.onError(() => this.restoreBackupDatabase(paths)))),
            Effect.ensuring(Effect.sync(() => this.deleteDatabaseFiles(paths.tempDatabasePath)))
        );
    });

    private readonly prepare = Effect.fn('DatabaseRekeyService.prepare')(function* (
        this: DatabaseRekeyService,
        paths: RekeyPathsInterface,
        params: RekeyParamsInterface
    ) {
        this.deleteDatabaseFiles(paths.tempDatabasePath);
        this.deleteDatabaseFiles(paths.backupPath);
        yield* this.exportDatabase(paths.tempDatabasePath, params.nextKey);

        if (params.nextSettings) {
            yield* this.updateMigratedDatabaseSettings(paths.tempDatabaseName, params.nextKey, params.nextSettings);
        }
    });

    private readonly commit = Effect.fn('DatabaseRekeyService.commit')(function* (
        this: DatabaseRekeyService,
        paths: RekeyPathsInterface,
        onCommit: Effect.Effect<void>
    ) {
        yield* databaseLifecycleService.close();
        this.deleteDestinationSidecars(paths.destinationPath);
        if (new File(paths.destinationPath).exists) {
            yield* this.moveFile(paths.destinationPath, paths.backupPath);
        }
        yield* this.moveFile(paths.tempDatabasePath, paths.destinationPath);
        yield* onCommit;
        this.deleteDatabaseFiles(paths.backupPath);
    });

    private readonly restoreBackupDatabase = Effect.fn('DatabaseRekeyService.restoreBackupDatabase')(function* (
        this: DatabaseRekeyService,
        paths: RekeyPathsInterface
    ) {
        if (!new File(paths.backupPath).exists) {
            return;
        }

        this.deleteDatabaseFiles(paths.destinationPath);
        yield* this.moveFile(paths.backupPath, paths.destinationPath);
    });

    private readonly moveFile = Effect.fnUntraced(function* (sourcePath: string, destinationPath: string) {
        yield* Effect.promise(() => new File(sourcePath).move(new File(destinationPath)));
    });

    private readonly exportDatabase = Effect.fn('DatabaseRekeyService.exportDatabase')(function* (
        this: DatabaseRekeyService,
        tempDatabasePath: string,
        nextKey: string | null
    ) {
        yield* Effect.promise(() => expoDb.execAsync('PRAGMA wal_checkpoint(FULL)'));
        yield* Effect.promise(() => expoDb.execAsync('PRAGMA journal_mode = DELETE'));
        yield* Effect.promise(() =>
            expoDb.execAsync(
                `ATTACH DATABASE '${this.escapeSqlString(tempDatabasePath)}' AS migrated KEY '${this.escapeSqlString(nextKey ?? '')}';`
            )
        );
        yield* Effect.promise(() => expoDb.execAsync(`SELECT sqlcipher_export('migrated');`)).pipe(
            Effect.ensuring(Effect.promise(() => expoDb.execAsync('DETACH DATABASE migrated;')))
        );
    });

    private readonly updateMigratedDatabaseSettings = Effect.fn('DatabaseRekeyService.updateMigratedDatabaseSettings')(function* (
        this: DatabaseRekeyService,
        tempDatabaseName: string,
        nextKey: string | null,
        nextSettings: NonNullable<RekeyParamsInterface['nextSettings']>
    ) {
        yield* Effect.acquireUseRelease(
            Effect.promise(() => SQLite.openDatabaseAsync(tempDatabaseName, { enableChangeListener: true }, Paths.cache.uri)),
            tempDatabase => this.writeMigratedDatabaseSettings(tempDatabase, nextKey, nextSettings),
            tempDatabase => Effect.promise(() => tempDatabase.closeAsync())
        );
    });

    private readonly writeMigratedDatabaseSettings = Effect.fn('DatabaseRekeyService.writeMigratedDatabaseSettings')(function* (
        this: DatabaseRekeyService,
        tempDatabase: SQLite.SQLiteDatabase,
        nextKey: string | null,
        nextSettings: NonNullable<RekeyParamsInterface['nextSettings']>
    ) {
        if (isNotEmptyString(nextKey)) {
            yield* Effect.promise(() => tempDatabase.execAsync(`PRAGMA key = '${this.escapeSqlString(nextKey)}';`));
        }

        const tempDrizzleDatabase = drizzle(tempDatabase, { schema });

        yield* new SettingsRepository(tempDrizzleDatabase).update(nextSettings).pipe(Effect.provideService(Db, tempDrizzleDatabase));
    });

    private getPaths(): RekeyPathsInterface {
        const tempDatabaseName = 'auth-migration.db';
        const destinationPath = `${String(SQLite.defaultDatabaseDirectory)}/${DB_NAME}`;

        return {
            tempDatabaseName,
            tempDatabasePath: `${Paths.cache.uri}/${tempDatabaseName}`,
            destinationPath,
            backupPath: `${destinationPath}.bak`
        };
    }

    private deleteDestinationSidecars(destinationPath: string): void {
        this.deleteFileIfExists(`${destinationPath}-wal`);
        this.deleteFileIfExists(`${destinationPath}-shm`);
    }

    private deleteDatabaseFiles(databasePath: string): void {
        this.deleteFileIfExists(databasePath);
        this.deleteFileIfExists(`${databasePath}-wal`);
        this.deleteFileIfExists(`${databasePath}-shm`);
    }

    private deleteFileIfExists(path: string): void {
        const file = new File(path);

        if (file.exists) {
            file.delete();
        }
    }

    private escapeSqlString(value: string): string {
        return value.replaceAll("'", "''");
    }
}

export const databaseRekeyService = new DatabaseRekeyService();
