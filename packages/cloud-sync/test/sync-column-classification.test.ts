import { SettingsEntityTable } from '@budgie/contracts';
import { expect, it } from '@effect/vitest';
import { getTableColumns, getTableName } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { SYNC_LOCAL_ONLY_PROPERTIES } from '../src/mapping/constant/sync-local-only-properties.constant';
import { SYNC_RECORD_DEFINITIONS } from '../src/mapping/constant/sync-record-definitions.constant';

const BASE_PROPERTIES = new Set(['createdAt', 'updatedAt', 'deletedAt']);

const SYNCED_PROPERTIES_BY_TABLE: Readonly<Record<string, readonly string[]>> = {
    accounts: [
        'icon',
        'parentId',
        'order',
        'title',
        'type',
        'nature',
        'debtType',
        'instrumentId',
        'externalId',
        'deadline',
        'targetBalance',
        'targetBaseInstrumentId',
        'targetBaseExchangeRate',
        'targetBaseAmount',
        'interestRate',
        'installmentCount',
        'externalSource',
        'integrationId',
        'iban',
        'includeInNetWorth',
        'isActive',
        'isExternal'
    ],
    bank_integrations: ['provider', 'label', 'externalClientId', 'ownerInstallId'],
    categories: ['title', 'icon', 'iconSource', 'parentId', 'isDefault', 'isSystemCategory'],
    tags: ['title'],
    transactions: [
        'type',
        'title',
        'externalId',
        'operatedAt',
        'comment',
        'toAccountId',
        'fromAccountId',
        'exchangeRate',
        'externalSource',
        'updatedBy',
        'importFingerprint',
        'consolidationParentTransactionId',
        'consolidationType',
        'fundAccountId'
    ]
};

const descriptors = Object.values(SYNC_RECORD_DEFINITIONS).flatMap(definition => [
    definition.parent,
    ...definition.children.map(child => child.descriptor),
    ...(isDefined(definition.legPrivateEntries) ? [definition.legPrivateEntries.descriptor] : [])
]);

const syncedPropertiesOf = (tableName: string): string[] =>
    [
        ...new Set(
            descriptors
                .filter(descriptor => descriptor.tableName === tableName)
                .flatMap(descriptor => descriptor.columns.map(column => column.property))
                .filter(property => !BASE_PROPERTIES.has(property))
        )
    ].sort();

it.effect('every table with local-only state lists exactly the columns it syncs', () =>
    Effect.sync(() => {
        const classifiedTableNames = new Set([...Object.keys(SYNCED_PROPERTIES_BY_TABLE), ...Object.keys(SYNC_LOCAL_ONLY_PROPERTIES)]);

        for (const tableName of classifiedTableNames) {
            const expected = [...(SYNCED_PROPERTIES_BY_TABLE[tableName] ?? [])].sort();
            const actual = syncedPropertiesOf(tableName);

            expect(
                {
                    unclassifiedSyncingColumns: actual.filter(property => !expected.includes(property)),
                    listedButNotSyncing: expected.filter(property => !actual.includes(property))
                },
                `${tableName}: classify each new column as synced (SYNCED_PROPERTIES_BY_TABLE) or local-only (SYNC_LOCAL_ONLY_PROPERTIES)`
            ).toEqual({ unclassifiedSyncingColumns: [], listedButNotSyncing: [] });
        }
    })
);

it.effect('local-only properties name real columns of synced tables', () =>
    Effect.sync(() => {
        for (const [tableName, properties] of Object.entries(SYNC_LOCAL_ONLY_PROPERTIES)) {
            const descriptor = descriptors.find(candidate => candidate.tableName === tableName);

            expect(isDefined(descriptor), `${tableName} is listed as local-only but is not a synced table`).toBe(true);
            expect(
                properties.filter(property => !isDefined(descriptor) || !(property in getTableColumns(descriptor.table))),
                `${tableName}: local-only properties that are not columns, so a renamed column would sync`
            ).toEqual([]);
        }
    })
);

it.effect('device settings are never synced', () =>
    Effect.sync(() => {
        expect(descriptors.map(descriptor => descriptor.tableName)).not.toContain(getTableName(SettingsEntityTable));
    })
);
