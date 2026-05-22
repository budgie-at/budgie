import { getErrorMessage, isNumber, isNotEmptyString } from '@rnw-community/shared';
import { useEffect, useState } from 'react';

import migrations from '../../../../drizzle/migrations';
import { executeSqlBatch, initializeDb, opSqliteDb } from '../db/db';

import type { MigrationResultInterface } from './interface/migration-result.interface';
import type { OpSqliteMigrationConfigInterface } from './interface/op-sqlite-migration-config.interface';

const MIGRATIONS_TABLE = '__drizzle_migrations';

const getLastMigrationTimestamp = async (): Promise<number> => {
    await opSqliteDb.execute(
        `CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (id INTEGER PRIMARY KEY AUTOINCREMENT, hash text NOT NULL, created_at numeric)`
    );

    const result = await opSqliteDb.execute(`SELECT id, hash, created_at FROM ${MIGRATIONS_TABLE} ORDER BY created_at DESC LIMIT 1`);
    const createdAt = result.rows[0]?.['created_at'];

    return isNumber(createdAt) ? createdAt : 0;
};

const buildPendingMigrationQueries = (config: OpSqliteMigrationConfigInterface, lastMigrationTimestamp: number): string[] => {
    return config.journal.entries.flatMap(entry => {
        if (entry.when <= lastMigrationTimestamp) {
            return [];
        }

        const key = `m${String(entry.idx).padStart(4, '0')}`;
        const query = config.migrations[key];

        if (!isNotEmptyString(query)) {
            throw new Error(`Missing migration: ${entry.tag}`);
        }

        const migrationQueries = query
            .split('--> statement-breakpoint')
            .map(statement => statement.trim())
            .filter(isNotEmptyString);

        return [...migrationQueries, `INSERT INTO \`${MIGRATIONS_TABLE}\` ("hash", "created_at") VALUES('', '${entry.when}')`];
    });
};

const migrateOpSqlite = async (config: OpSqliteMigrationConfigInterface): Promise<void> => {
    const lastMigrationTimestamp = await getLastMigrationTimestamp();
    const migrationQueries = buildPendingMigrationQueries(config, lastMigrationTimestamp);

    if (migrationQueries.length > 0) {
        await executeSqlBatch(migrationQueries);
    }
};

export const useOpSqliteMigrations = (): MigrationResultInterface => {
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<Error>();

    useEffect(() => {
        let isMounted = true;

        initializeDb()
            .then(() => migrateOpSqlite(migrations))
            .then(() => isMounted && setSuccess(true))
            .catch(nextError => isMounted && setError(new Error(getErrorMessage(nextError))));

        return () => {
            isMounted = false;
        };
    }, []);

    return { success, error };
};
