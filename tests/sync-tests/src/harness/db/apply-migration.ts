import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { testDb } from '../scenario/setup';

export const applyMigration = async (fileName: string): Promise<void> => {
    const sqlText = readFileSync(resolve(process.cwd(), '../../packages/app/drizzle', fileName), 'utf8');

    await sqlText
        .split('--> statement-breakpoint')
        .reduce<Promise<void>>(
            (migrationPromise, statement) => migrationPromise.then(() => testDb.$client.execAsync(statement)),
            Promise.resolve()
        );
};
