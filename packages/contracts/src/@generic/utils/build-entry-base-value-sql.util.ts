import { sql } from 'drizzle-orm';

import { AccountEntityTable } from '../../account/table/account-entity.table';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';

import { buildConversionRateSql } from './build-conversion-rate-sql.util';
import { roundToMinorUnitSql } from './round-to-minor-unit-sql.util';

export const buildEntryBaseValueSql = (defaultInstrumentId: number) =>
    roundToMinorUnitSql(sql`CASE
            WHEN ${TransactionEntryEntityTable.baseInstrumentId} = ${defaultInstrumentId}
            THEN ${TransactionEntryEntityTable.baseAmount}
            WHEN ${AccountEntityTable.instrumentId} = ${defaultInstrumentId}
            THEN ${TransactionEntryEntityTable.amount}
            ELSE ROUND(${TransactionEntryEntityTable.amount} * ${buildConversionRateSql(defaultInstrumentId, sql.raw('accounts.instrument_id'))})
        END`);
