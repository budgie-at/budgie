import { inArray, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';

import { ExternalSourceEnum } from '../../account/enum/external-source.enum';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { PERSONAL_SYNC_ZONE } from '../constant/personal-sync-zone.constant';
import { SyncRecordTypeEnum } from '../enum/sync-record-type.enum';

import { buildHouseholdOwnershipSql } from './build-household-ownership-sql.util';

const BANK_ACCOUNT_ID_SOURCES = [
    ExternalSourceEnum.MONOBANK,
    ExternalSourceEnum.PRIVATBANK,
    ExternalSourceEnum.ERSTE,
    ExternalSourceEnum.ENABLE_BANKING
];

const PersonalBankAccountTable = alias(AccountEntityTable, 'personal_bank_account');

export const buildDuplicateOfOwnAccountSql = () => sql`(NOT ${buildHouseholdOwnershipSql(SyncRecordTypeEnum.ACCOUNT)} AND EXISTS (
    SELECT 1 FROM ${AccountEntityTable} AS ${PersonalBankAccountTable}
    WHERE ${PersonalBankAccountTable.syncZone} = ${PERSONAL_SYNC_ZONE}
      AND ${PersonalBankAccountTable.deletedAt} IS NULL
      AND ${inArray(PersonalBankAccountTable.externalSource, BANK_ACCOUNT_ID_SOURCES)}
      AND ${PersonalBankAccountTable.externalSource} = ${AccountEntityTable.externalSource}
      AND ${PersonalBankAccountTable.externalId} = ${AccountEntityTable.externalId}
))`;
