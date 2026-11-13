import {
    AccountEntityTable,
    InstrumentEntityTable,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    YieldRepository
} from '@budgie/contracts';

import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

import type { YieldScopeInterface } from '@budgie/contracts';

export const hasYieldFamily = databaseQueryFamily(
    [TransactionEntityTable, TransactionEntryEntityTable, AccountEntityTable, InstrumentEntityTable],
    YieldRepository,
    (repository, scope: YieldScopeInterface) => repository.hasYieldFor(scope)
);
