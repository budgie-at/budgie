import { eq, inArray, sql } from 'drizzle-orm';

import { BANK_AUTHORITATIVE_ACCOUNT_TYPES } from '../../account/constant/bank-authoritative-account-types.constant';
import { SyncBalanceAuthorityEnum } from '../enum/sync-balance-authority.enum';
import { SyncEntityTable } from '../table/sync-entity.table';

import type { SQL, SQLWrapper } from 'drizzle-orm';

export const getProviderAuthoritativeAccountConditionSql = (accountIdReference: SQLWrapper = sql.raw('accounts.id')): SQL =>
    sql`(
        ${inArray(sql.raw('accounts.type'), BANK_AUTHORITATIVE_ACCOUNT_TYPES)}
        OR EXISTS (
            SELECT 1
            FROM ${SyncEntityTable}
            WHERE ${SyncEntityTable.accountId} = ${accountIdReference}
              AND ${SyncEntityTable.balanceAuthority} = ${SyncBalanceAuthorityEnum.PROVIDER}
              AND ${eq(SyncEntityTable.enabled, true)}
              AND ${SyncEntityTable.deletedAt} IS NULL
        )
    )`;
