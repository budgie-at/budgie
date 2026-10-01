import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import * as Effect from 'effect/Effect';

import { testDb } from '../scenario/setup';

export const applyMigration = (migrationName: string): Effect.Effect<void> =>
    Effect.forEach(
        readFileSync(resolve(process.cwd(), '../../packages/app/drizzle', migrationName, 'migration.sql'), 'utf8').split('--> statement-breakpoint'),
        statement => Effect.promise(() => testDb.$client.execAsync(statement)),
        { discard: true }
    );
