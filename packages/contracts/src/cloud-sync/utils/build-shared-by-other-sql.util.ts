import { sql } from 'drizzle-orm';

import { AccountEntityTable } from '../../account/table/account-entity.table';
import { BudgetEntityTable } from '../../budget/table/budget-entity.table';
import { HOUSEHOLD_SYNC_ZONE } from '../constant/household-sync-zone.constant';
import { PERSONAL_SYNC_ZONE } from '../constant/personal-sync-zone.constant';
import { SyncRecordTypeEnum } from '../enum/sync-record-type.enum';
import { SyncOutboxEntityTable } from '../table/sync-outbox-entity.table';
import { SyncRecordEntityTable } from '../table/sync-record-entity.table';

export const buildSharedByOtherSql = (recordType: SyncRecordTypeEnum.ACCOUNT | SyncRecordTypeEnum.BUDGET) => {
    const table = recordType === SyncRecordTypeEnum.ACCOUNT ? AccountEntityTable : BudgetEntityTable;

    return sql`(
    ${table.syncZone} = ${HOUSEHOLD_SYNC_ZONE}
    AND NOT EXISTS (
        SELECT 1 FROM ${SyncRecordEntityTable}
        WHERE ${SyncRecordEntityTable.syncZone} = ${PERSONAL_SYNC_ZONE}
          AND ${SyncRecordEntityTable.syncId} = ${table.syncId}
          AND ${SyncRecordEntityTable.recordType} = ${recordType}
    )
    AND NOT EXISTS (
        SELECT 1 FROM ${SyncOutboxEntityTable}
        WHERE ${SyncOutboxEntityTable.syncZone} = ${PERSONAL_SYNC_ZONE}
          AND ${SyncOutboxEntityTable.syncId} = ${table.syncId}
          AND ${SyncOutboxEntityTable.recordType} = ${recordType}
    )
)`;
};
