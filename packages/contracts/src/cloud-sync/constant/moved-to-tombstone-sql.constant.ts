import { SyncRecordTypeEnum } from '../enum/sync-record-type.enum';

import { PERSONAL_SYNC_ZONE } from './personal-sync-zone.constant';

export const MOVED_TO_TOMBSTONE_SQL = `sync_zone = '${PERSONAL_SYNC_ZONE}' AND record_type = '${SyncRecordTypeEnum.ACCOUNT}' AND json_extract(payload, '$.encryptedFields.movedTo') IS NOT NULL`;
