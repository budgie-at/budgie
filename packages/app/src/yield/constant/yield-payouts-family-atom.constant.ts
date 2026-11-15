import { YieldService } from '@budgie/market';

import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { TRANSACTION_LIST_TABLES } from '../../transaction/constant/transaction-list-tables.constant';

import type { LanguageEnum } from '@budgie/contracts';
import type { YieldQueryKeyInterface } from '@budgie/market';

export const yieldPayoutsFamily = databaseQueryFamily(
    TRANSACTION_LIST_TABLES,
    YieldService,
    (service, [key, isUnassignedOnly, language, limit]: readonly [YieldQueryKeyInterface, boolean, LanguageEnum, number]) =>
        service.findPayouts(key, isUnassignedOnly, language, limit)
);
