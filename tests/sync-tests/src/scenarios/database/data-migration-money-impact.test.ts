import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, it } from '@effect/vitest';

import { isNotEmptyArray } from '@rnw-community/shared';

import {
    ambiguousDuplicateTransferScenario,
    editedCompetingCanonicalScenario,
    editedOriginalTransactionScenario,
    extraEditedMovedOriginalScenario,
    feeBearingCompetingCanonicalScenario,
    malformedBridgeTopologyScenario,
    preCalibrationDuplicateScenario,
    unprovenDuplicateTransferScenario,
    staleBalanceSnapshotScenario
} from './data-migration-money-impact.scenario';
import { unchangedLedgerScenario } from './unchanged-ledger.scenario';

const MIGRATIONS_FOLDER = resolve(process.cwd(), '../../packages/app/drizzle');
const DATA_CHANGE_PATTERN = /\b(?:UPDATE\s+\S+\s+SET|INSERT(?:\s+OR\s+\w+)?\s+INTO|DELETE\s+FROM)\b/iu;

const dataMigrations = readdirSync(MIGRATIONS_FOLDER, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .filter(migrationName => !migrationName.endsWith('_baseline'))
    .filter(migrationName => DATA_CHANGE_PATTERN.test(readFileSync(resolve(MIGRATIONS_FOLDER, migrationName, 'migration.sql'), 'utf8')));

describe.runIf(isNotEmptyArray(dataMigrations))('database/data-migration-money-impact', () => {
    it.effect.each(dataMigrations)('%s leaves every ledger balance unchanged after consolidation', unchangedLedgerScenario);
    it.effect('preserves unproven bridge and transfer-pair canonical originals and tags', () => unprovenDuplicateTransferScenario());
    it.effect.each([30, 60])('preserves unproven duplicate canonicals at a %s-second bridge/pair gap', unprovenDuplicateTransferScenario);
    it.effect('skips ambiguous equal-amount duplicate canonical groups', ambiguousDuplicateTransferScenario);
    it.effect('skips fee-bearing competing duplicate canonical groups', feeBearingCompetingCanonicalScenario);
    it.effect('skips groups with an edited competing canonical', editedCompetingCanonicalScenario);
    it.effect('skips duplicate canonicals when the stored balance snapshot is older than the duplicate', staleBalanceSnapshotScenario);
    it.effect('skips duplicate canonicals with malformed bridge topology', malformedBridgeTopologyScenario);
    it.effect('skips duplicate canonicals with edited original transactions', editedOriginalTransactionScenario);
    it.effect('skips duplicate canonicals with extra edited moved original entries', extraEditedMovedOriginalScenario);
    it.effect('skips duplicate canonicals created before sync balance calibration', preCalibrationDuplicateScenario);
});
