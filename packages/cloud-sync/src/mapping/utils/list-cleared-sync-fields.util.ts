import { isDefined } from '@rnw-community/shared';

import { SYNC_RECORD_DEFINITIONS } from '../constant/sync-record-definitions.constant';
import { SyncLinkRoleEnum } from '../enum/sync-link-role.enum';

import type { SyncRecordInterface } from '../interface/sync-record.interface';

export const listClearedSyncFields = (record: SyncRecordInterface): readonly string[] => {
    const definition = SYNC_RECORD_DEFINITIONS[record.recordType];
    const fields = [
        ...definition.parent.columns.map(column => column.field),
        ...definition.children.map(child => child.field),
        ...(isDefined(definition.legPrivateEntries) ? [definition.legPrivateEntries.field] : []),
        ...(definition.linkRole === SyncLinkRoleEnum.HOME ? ['linkId', 'legCount'] : [])
    ];

    return fields.filter(field => !(field in record.encryptedFields));
};
