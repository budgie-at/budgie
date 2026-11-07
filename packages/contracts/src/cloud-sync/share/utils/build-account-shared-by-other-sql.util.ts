import { sql } from 'drizzle-orm';

import { AccountEntityTable } from '../../../account/table/account-entity.table';
import { HOUSEHOLD_SYNC_ZONE } from '../../constant/household-sync-zone.constant';
import { PERSONAL_SYNC_ZONE } from '../../constant/personal-sync-zone.constant';
import { SyncRecordTypeEnum } from '../../mapping/enum/sync-record-type.enum';
import { SyncOutboxEntityTable } from '../../table/sync-outbox-entity.table';
import { SyncRecordEntityTable } from '../../table/sync-record-entity.table';

export const buildAccountSharedByOtherSql = () => sql`(
    ${AccountEntityTable.syncZone} = ${HOUSEHOLD_SYNC_ZONE}
    AND NOT EXISTS (
        SELECT 1 FROM ${SyncRecordEntityTable}
        WHERE ${SyncRecordEntityTable.syncZone} = ${PERSONAL_SYNC_ZONE}
          AND ${SyncRecordEntityTable.syncId} = ${AccountEntityTable.syncId}
          AND ${SyncRecordEntityTable.recordType} = ${SyncRecordTypeEnum.ACCOUNT}
    )
    AND NOT EXISTS (
        SELECT 1 FROM ${SyncOutboxEntityTable}
        WHERE ${SyncOutboxEntityTable.syncZone} = ${PERSONAL_SYNC_ZONE}
          AND ${SyncOutboxEntityTable.syncId} = ${AccountEntityTable.syncId}
          AND ${SyncOutboxEntityTable.recordType} = ${SyncRecordTypeEnum.ACCOUNT}
    )
)`;
