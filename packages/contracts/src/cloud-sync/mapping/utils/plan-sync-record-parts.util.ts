import * as Result from 'effect/Result';

import { isDefined, isNotEmptyString, isNumber } from '@rnw-community/shared';

import { PERSONAL_SYNC_ZONE } from '../../constant/personal-sync-zone.constant';
import { SYNC_ID_PROPERTY, SYNC_ZONE_PROPERTY } from '../constant/sync-identity-properties.constant';
import { SYNC_RECORD_DEFINITIONS } from '../constant/sync-record-definitions.constant';
import { SyncRecordTypeEnum } from '../enum/sync-record-type.enum';
import { SyncIdentityUnresolvedError } from '../error/sync-identity-unresolved.error';

import { deriveTransactionLinkId } from './derive-transaction-link-id.util';
import { resolveHomeZone } from './resolve-home-zone.util';

import type { SyncAggregateInterface } from '../interface/sync-aggregate.interface';
import type { SyncRecordPartInterface } from '../interface/sync-record-part.interface';
import type { SyncReferenceResolverInterface } from '../interface/sync-reference-resolver.interface';
import type { ZonedSyncEntryInterface } from '../interface/zoned-sync-entry.interface';
import type { SyncRowInputType } from '../type/sync-row-input.type';

const ACCOUNTS_TABLE = 'accounts';
const ENTRIES_TABLE = 'transaction_entries';
const LEG_ACCOUNT_PROPERTIES = ['fromAccountId', 'toAccountId'];

const resolveParentZone = (parent: SyncRowInputType): string => {
    const parentZone = parent[SYNC_ZONE_PROPERTY];

    return isNotEmptyString(parentZone) ? parentZone : PERSONAL_SYNC_ZONE;
};

const buildWholePart = (aggregate: SyncAggregateInterface, parentSyncId: string, zone: string): SyncRecordPartInterface => ({
    definition: SYNC_RECORD_DEFINITIONS[aggregate.recordType],
    recordName: parentSyncId,
    zone,
    parent: aggregate.parent,
    children: aggregate.children,
    legPrivateRows: [],
    extraFields: {}
});

const zoneEntries = (
    aggregate: SyncAggregateInterface,
    resolver: SyncReferenceResolverInterface
): Result.Result<readonly ZonedSyncEntryInterface[], SyncIdentityUnresolvedError> =>
    Result.gen(function* () {
        const zonedEntries: ZonedSyncEntryInterface[] = [];

        for (const entry of aggregate.children[ENTRIES_TABLE] ?? []) {
            const { accountId } = entry;
            const identity = isNumber(accountId) ? resolver.findSyncIdentity(ACCOUNTS_TABLE, accountId) : null;

            if (!isDefined(identity)) {
                return yield* Result.fail(
                    SyncIdentityUnresolvedError.make({
                        tableName: ENTRIES_TABLE,
                        column: 'accountId',
                        localKey: isNotEmptyString(entry[SYNC_ID_PROPERTY]) ? entry[SYNC_ID_PROPERTY] : ''
                    })
                );
            }

            zonedEntries.push({ entry, zone: identity.syncZone });
        }

        return zonedEntries;
    });

const planSplitParts = (
    aggregate: SyncAggregateInterface,
    parentSyncId: string,
    zonedEntries: readonly ZonedSyncEntryInterface[],
    resolver: SyncReferenceResolverInterface
): readonly SyncRecordPartInterface[] => {
    const { parent, children } = aggregate;
    const definition = SYNC_RECORD_DEFINITIONS[aggregate.recordType];
    const entryZones = [...new Set(zonedEntries.map(({ zone }) => zone))].sort();
    const homeZone = resolveHomeZone(entryZones, resolveParentZone(parent));
    const legZones = entryZones.filter(zone => zone !== homeZone);
    const linkId = deriveTransactionLinkId(parentSyncId);
    const entriesIn = (zone: string): readonly SyncRowInputType[] =>
        zonedEntries.filter(zonedEntry => zonedEntry.zone === zone).map(({ entry }) => entry);
    const isAccountIn = (accountId: unknown, zone: string): boolean =>
        isNumber(accountId) && resolver.findSyncIdentity(ACCOUNTS_TABLE, accountId)?.syncZone === zone;
    const homePart: SyncRecordPartInterface = {
        definition,
        recordName: parentSyncId,
        zone: homeZone,
        parent,
        children: { ...children, [ENTRIES_TABLE]: entriesIn(homeZone) },
        legPrivateRows: legZones.flatMap(entriesIn),
        extraFields: { linkId, legCount: legZones.length }
    };
    const legPart = (zone: string): SyncRecordPartInterface => ({
        definition: SYNC_RECORD_DEFINITIONS[SyncRecordTypeEnum.TRANSACTION_LEG],
        recordName: linkId,
        zone,
        parent: {
            ...parent,
            ...Object.fromEntries(
                LEG_ACCOUNT_PROPERTIES.map(property => [property, isAccountIn(parent[property], zone) ? parent[property] : null])
            )
        },
        children: { [ENTRIES_TABLE]: entriesIn(zone) },
        legPrivateRows: [],
        extraFields: { linkId }
    });

    return [homePart, ...legZones.map(legPart)];
};

export const planSyncRecordParts = (
    aggregate: SyncAggregateInterface,
    resolver: SyncReferenceResolverInterface
): Result.Result<readonly SyncRecordPartInterface[], SyncIdentityUnresolvedError> =>
    Result.gen(function* () {
        const { parent } = aggregate;
        const parentSyncId = parent[SYNC_ID_PROPERTY];

        if (!isNotEmptyString(parentSyncId)) {
            return yield* Result.fail(
                SyncIdentityUnresolvedError.make({
                    tableName: aggregate.recordType,
                    column: SYNC_ID_PROPERTY,
                    localKey: isNumber(parent['id']) ? `${parent['id']}` : ''
                })
            );
        }

        const parentZone = resolveParentZone(parent);

        if (aggregate.recordType !== SyncRecordTypeEnum.TRANSACTION) {
            return [buildWholePart(aggregate, parentSyncId, parentZone)];
        }

        const zonedEntries = yield* zoneEntries(aggregate, resolver);
        const entryZones = new Set(zonedEntries.map(({ zone }) => zone));

        if (entryZones.size <= 1) {
            return [buildWholePart(aggregate, parentSyncId, [...entryZones][0] ?? parentZone)];
        }

        return planSplitParts(aggregate, parentSyncId, zonedEntries, resolver);
    });
