import { isNull, notInArray, or } from 'drizzle-orm';

import { ACCOUNT_DELETED_TRANSFER_CATEGORY_ID } from '../../category/constant/account-deleted-transfer-category-id.constant';
import { CASH_WITHDRAWAL_TRACKED_CATEGORY_ID } from '../../category/constant/cash-withdrawal-tracked-category-id.constant';
import { TransactionEntryEntityTable } from '../table/transaction-entry-entity.table';

export const buildSpendingEntryCondition = () =>
    or(
        isNull(TransactionEntryEntityTable.categoryId),
        notInArray(TransactionEntryEntityTable.categoryId, [CASH_WITHDRAWAL_TRACKED_CATEGORY_ID, ACCOUNT_DELETED_TRANSFER_CATEGORY_ID])
    );
