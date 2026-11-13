import { type SQL, inArray, sql } from 'drizzle-orm';

import { InstrumentTypeEnum } from '../../instrument/enum/instrument-type.enum';
import { InstrumentEntityTable } from '../../instrument/table/instrument-entity.table';
import { CRYPTO_ACCOUNT_TYPES } from '../constant/crypto-account-types.constant';
import { AccountEntityTable } from '../table/account-entity.table';

export const isUnitAccountSql = (
    accountType: SQL | typeof AccountEntityTable.type = AccountEntityTable.type,
    instrumentId: SQL | typeof AccountEntityTable.instrumentId = AccountEntityTable.instrumentId
) =>
    sql`(${inArray(sql`${accountType}`, CRYPTO_ACCOUNT_TYPES)} OR EXISTS (SELECT 1 FROM ${InstrumentEntityTable} WHERE ${InstrumentEntityTable.id} = ${instrumentId} AND ${InstrumentEntityTable.type} != ${InstrumentTypeEnum.FIAT}))`;
