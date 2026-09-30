import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { TestLayer } from '../../harness';

import { LaterDebtTransferMigrationScenario } from './later-debt-transfer-migration.scenario';

const scenarioDirectory = resolve(fileURLToPath(import.meta.url), '..');
const fixturePath = resolve(scenarioDirectory, '../../../fixtures/debt-migration/post-0035-later-borrowed-transfer.db');

describe('later debt transfer migration', () => {
    it.effect('moves a principal transfer created after migration 0035 onto its funding account', () =>
        Effect.gen(function* () {
            yield* Effect.promise(() => new LaterDebtTransferMigrationScenario(fixturePath).run());
        }).pipe(Effect.provide(TestLayer))
    );
});
