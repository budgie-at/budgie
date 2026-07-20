import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, it } from 'vitest';

import { DebtMigrationRepairScenario } from './debt-migration-repair.scenario';
import { LegacyDebtFixtureShape } from './legacy-debt-fixture-shape';

const scenarioDirectory = resolve(fileURLToPath(import.meta.url), '..');
const preMigrationFixturePath = resolve(scenarioDirectory, '../../../fixtures/debt-migration/pre-0033.db');

describe('debt migration repair', () => {
    it('preserves the ambiguous legacy fixture shape', () => {
        new LegacyDebtFixtureShape(preMigrationFixturePath).assert();
    });

    it.each([
        {
            fixturePath: preMigrationFixturePath,
            history: 'pre-0033'
        },
        {
            fixturePath: resolve(scenarioDirectory, '../../../fixtures/debt-migration/early-0033.db'),
            history: 'early-0033'
        },
        {
            fixturePath: resolve(scenarioDirectory, '../../../fixtures/debt-migration/missing-1007-debt-event.db'),
            history: 'missing-1007-debt-event'
        }
    ])('repairs the $history borrowed debt history', async ({ fixturePath }) => {
        await new DebtMigrationRepairScenario(fixturePath).run();
    });
});
