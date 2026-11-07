import { SyncRecordTypeEnum } from '../enum/sync-record-type.enum';

import { PERSONAL_SYNC_ZONE } from './personal-sync-zone.constant';

export const MOVED_TO_TOMBSTONE_SQL =
    "sync_zone = ? AND record_type IN (?, ?) AND json_extract(payload, '$.encryptedFields.movedTo') IS NOT NULL";
export const MOVED_TO_TOMBSTONE_PARAMETERS = [PERSONAL_SYNC_ZONE, SyncRecordTypeEnum.ACCOUNT, SyncRecordTypeEnum.BUDGET];
