import { TransactionTypeEnum } from '../../transaction/enum/transaction-type.enum';
import { TransactionEntryKindEnum } from '../../transaction-entry/enum/transaction-entry-kind.enum';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';

import type { SQL } from 'drizzle-orm';

export interface AccountBalanceDebtProgressEntryAmountSqlParamsInterface {
    readonly accountIdReference: SQL;
    readonly baseInstrumentId: number | null;
    readonly exchangeRateSql: SQL | null;
    readonly transactionEntryKind: TransactionEntryKindEnum;
    readonly transactionEntryType: TransactionEntryTypeEnum;
    readonly transactionType: TransactionTypeEnum | null;
}
