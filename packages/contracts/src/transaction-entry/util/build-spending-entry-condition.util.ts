import { isNull, ne, or } from 'drizzle-orm';

import { CASH_WITHDRAWAL_TRACKED_CATEGORY_ID } from '../../category/constant/cash-withdrawal-tracked-category-id.constant';
import { TransactionEntryEntityTable } from '../table/transaction-entry-entity.table';

export const buildSpendingEntryCondition = () =>
    or(isNull(TransactionEntryEntityTable.categoryId), ne(TransactionEntryEntityTable.categoryId, CASH_WITHDRAWAL_TRACKED_CATEGORY_ID));
