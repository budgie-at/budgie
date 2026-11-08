import { SyncRecordTypeEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import type { DecodedSyncRecordInterface } from '../interface/decoded-sync-record.interface';
import type { JoinedSyncRecordsInterface } from '../interface/joined-sync-records.interface';
import type { SyncRowInterface } from '../interface/sync-row.interface';

const ENTRIES_TABLE = 'transaction_entries';
const TRANSACTIONS_TABLE = 'transactions';

const moveEntryToHome = (row: SyncRowInterface, legRecordName: string, home: DecodedSyncRecordInterface): SyncRowInterface => ({
    ...row,
    values: { ...row.values, ...home.legPrivateRows.find(privateRow => privateRow.syncId === row.syncId)?.values },
    references: row.references.map(reference =>
        reference.tableName === TRANSACTIONS_TABLE && reference.key === legRecordName ? { ...reference, key: home.recordName } : reference
    )
});

const mergeHomeWithLegs = (home: DecodedSyncRecordInterface, legs: readonly DecodedSyncRecordInterface[]): DecodedSyncRecordInterface => ({
    ...home,
    rows: [
        ...home.rows,
        ...legs.flatMap(leg =>
            leg.rows.filter(row => row.tableName === ENTRIES_TABLE).map(row => moveEntryToHome(row, leg.recordName, home))
        )
    ]
});

export const joinSplitTransactions = (records: readonly DecodedSyncRecordInterface[]): JoinedSyncRecordsInterface => {
    const legs = records.filter(record => record.recordType === SyncRecordTypeEnum.TRANSACTION_LEG);
    const homes = records.filter(record => record.recordType === SyncRecordTypeEnum.TRANSACTION && isDefined(record.linkId));
    const passthrough = records.filter(record => !legs.includes(record) && !homes.includes(record));
    const joined: DecodedSyncRecordInterface[] = [...passthrough];
    const claimedLegs = new Set<DecodedSyncRecordInterface>();
    const unmatched: DecodedSyncRecordInterface[] = [];

    for (const home of homes) {
        const legsByZone = new Map<string, DecodedSyncRecordInterface>();

        for (const leg of legs) {
            if (leg.linkId === home.linkId) {
                legsByZone.set(leg.zone, leg);
                claimedLegs.add(leg);
            }
        }

        const homeLegs = [...legsByZone.values()];

        if (homeLegs.length >= home.legCount) {
            joined.push(mergeHomeWithLegs(home, homeLegs));
        } else {
            unmatched.push(home, ...homeLegs);
        }
    }

    unmatched.push(...legs.filter(leg => !claimedLegs.has(leg)));

    return { joined, unmatched };
};
