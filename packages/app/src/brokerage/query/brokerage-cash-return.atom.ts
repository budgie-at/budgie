import {
    AccountEntityTable,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryPositionRepository
} from '@budgie/contracts';

import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

export const brokerageCashReturnAtom = databaseQueryFamily(
    [AccountEntityTable, TransactionEntityTable, TransactionEntryEntityTable],
    TransactionEntryPositionRepository,
    (repository, [accountIds, baseInstrumentId]: readonly [readonly number[], number]) =>
        repository.findCashReturn(accountIds, baseInstrumentId)
);
