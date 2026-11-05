import * as Result from 'effect/Result';

import { isDefined, isNotEmptyString, isNumber } from '@rnw-community/shared';

import { PERSONAL_SYNC_ZONE } from '../../constant/personal-sync-zone.constant';
import { deriveSyncId } from '../../utils/derive-sync-id.util';
import { SYNC_ID_PROPERTY, SYNC_ZONE_PROPERTY } from '../constant/sync-identity-properties.constant';
import { SYNC_RECORD_DEFINITIONS } from '../constant/sync-record-definitions.constant';
import { SyncIdentityUnresolvedError } from '../error/sync-identity-unresolved.error';
import { SyncRecordTypeEnum } from '../enum/sync-record-type.enum';

import type { SyncAggregateInterface } from '../interface/sync-aggregate.interface';
import type { SyncRecordPartInterface } from '../interface/sync-record-part.interface';
import type { SyncReferenceResolverInterface } from '../interface/sync-reference-resolver.interface';
import type { SyncRowInputType } from '../type/sync-row-input.type';
import type { ZonedSyncEntryInterface } from '../interface/zoned-sync-entry.interface';

const TRANSACTION_LINK_NAMESPACE = '5d7e0a3c-2f6b-4b1e-9c84-0e1a6f3d7b92';
const ACCOUNTS_TABLE = 'accounts';
const ENTRIES_TABLE = 'transaction_entries';
const LEG_ACCOUNT_PROPERTIES = ['fromAccountId', 'toAccountId'];

const resolveHomeZone = (entryZones: readonly string[], parentZone: string): string => {
    if (entryZones.includes(PERSONAL_SYNC_ZONE)) {
        return PERSONAL_SYNC_ZONE;
    }

    return entryZones.includes(parentZone) ? parentZone : entryZones[0];
};

export const planSyncRecordParts = (
    aggregate: SyncAggregateInterface,
    resolver: SyncReferenceResolverInterface
): Result.Result<readonly SyncRecordPartInterface[], SyncIdentityUnresolvedError> =>
    Result.gen(function* () {
        const { parent, children } = aggregate;
        const parentSyncId = parent[SYNC_ID_PROPERTY];
        const parentZoneValue = parent[SYNC_ZONE_PROPERTY];

        if (!isNotEmptyString(parentSyncId)) {
            return yield* Result.fail(
                new SyncIdentityUnresolvedError({
                    tableName: aggregate.recordType,
                    column: SYNC_ID_PROPERTY,
                    localKey: isNumber(parent['id']) ? `${parent['id']}` : ''
                })
            );
        }

        const parentZone = isNotEmptyString(parentZoneValue) ? parentZoneValue : PERSONAL_SYNC_ZONE;
        const definition = SYNC_RECORD_DEFINITIONS[aggregate.recordType];
        const wholePart = (zone: string): SyncRecordPartInterface => ({
            definition,
            recordName: parentSyncId,
            zone,
            parent,
            children,
            legPrivateRows: [],
            extraFields: {}
        });

        if (aggregate.recordType !== SyncRecordTypeEnum.TRANSACTION) {
            return [wholePart(parentZone)];
        }

        const zonedEntries: ZonedSyncEntryInterface[] = [];

        for (const entry of children[ENTRIES_TABLE] ?? []) {
            const accountId = entry['accountId'];
            const identity = isNumber(accountId) ? resolver.findSyncIdentity(ACCOUNTS_TABLE, accountId) : null;

            if (!isDefined(identity)) {
                return yield* Result.fail(
                    new SyncIdentityUnresolvedError({
                        tableName: ENTRIES_TABLE,
                        column: 'accountId',
                        localKey: isNotEmptyString(entry[SYNC_ID_PROPERTY]) ? entry[SYNC_ID_PROPERTY] : ''
                    })
                );
            }

            zonedEntries.push({ entry, zone: identity.syncZone });
        }

        const entryZones = [...new Set(zonedEntries.map(({ zone }) => zone))].sort();

        if (entryZones.length <= 1) {
            return [wholePart(entryZones[0] ?? parentZone)];
        }

        const homeZone = resolveHomeZone(entryZones, parentZone);
        const legZones = entryZones.filter(zone => zone !== homeZone);
        const linkId = deriveSyncId(TRANSACTION_LINK_NAMESPACE, parentSyncId);
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
                ...Object.fromEntries(LEG_ACCOUNT_PROPERTIES.map(property => [property, isAccountIn(parent[property], zone) ? parent[property] : null]))
            },
            children: { [ENTRIES_TABLE]: entriesIn(zone) },
            legPrivateRows: [],
            extraFields: { linkId }
        });

        return [homePart, ...legZones.map(legPart)];
    });
