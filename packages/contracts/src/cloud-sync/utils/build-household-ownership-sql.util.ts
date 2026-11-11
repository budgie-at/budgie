import { inArray, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';

import { ExternalSourceEnum } from '../../account/enum/external-source.enum';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { BudgetEntityTable } from '../../budget/table/budget-entity.table';
import { CURRENT_CLOUD_USER_SQL } from '../constant/current-cloud-user-sql.constant';
import { HOUSEHOLD_SYNC_ZONE } from '../constant/household-sync-zone.constant';
import { PERSONAL_SYNC_ZONE } from '../constant/personal-sync-zone.constant';
import { SyncRecordTypeEnum } from '../enum/sync-record-type.enum';
import { SyncOutboxEntityTable } from '../table/sync-outbox-entity.table';
import { SyncRecordEntityTable } from '../table/sync-record-entity.table';

const BANK_ACCOUNT_ID_SOURCES = [
    ExternalSourceEnum.MONOBANK,
    ExternalSourceEnum.PRIVATBANK,
    ExternalSourceEnum.ERSTE,
    ExternalSourceEnum.ENABLE_BANKING
];

const PersonalBankAccountTable = alias(AccountEntityTable, 'personal_bank_account');

const samePersonalBankAccountSql = sql`EXISTS (
    SELECT 1 FROM ${AccountEntityTable} AS ${PersonalBankAccountTable}
    WHERE ${PersonalBankAccountTable.syncZone} = ${PERSONAL_SYNC_ZONE}
      AND ${PersonalBankAccountTable.deletedAt} IS NULL
      AND ${inArray(PersonalBankAccountTable.externalSource, BANK_ACCOUNT_ID_SOURCES)}
      AND ${PersonalBankAccountTable.externalSource} = ${AccountEntityTable.externalSource}
      AND ${PersonalBankAccountTable.externalId} = ${AccountEntityTable.externalId}
)`;

export const buildHouseholdOwnershipSql = (recordType: SyncRecordTypeEnum.ACCOUNT | SyncRecordTypeEnum.BUDGET) => {
    const table = recordType === SyncRecordTypeEnum.ACCOUNT ? AccountEntityTable : BudgetEntityTable;
    const isDuplicateCandidate = recordType === SyncRecordTypeEnum.ACCOUNT ? samePersonalBankAccountSql : sql`0`;
    const isUnprovenSql = sql`(
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
    AND NOT EXISTS (
        SELECT 1 FROM ${SyncRecordEntityTable}
        WHERE ${SyncRecordEntityTable.syncZone} = ${HOUSEHOLD_SYNC_ZONE}
          AND ${SyncRecordEntityTable.syncId} = ${table.syncId}
          AND ${SyncRecordEntityTable.recordType} = ${recordType}
          AND json_extract(${SyncRecordEntityTable.payload}, '$.encryptedFields.ownerId') = ${CURRENT_CLOUD_USER_SQL}
    )
)`;

    return {
        isOwned: sql`NOT ${isUnprovenSql}`,
        isSharedByOther: sql`(${isUnprovenSql} AND NOT ${isDuplicateCandidate})`,
        isDuplicateOfOwn: sql`(${isUnprovenSql} AND ${isDuplicateCandidate})`
    };
};
