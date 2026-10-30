import { TransactionTypeEnum } from '@budgie/contracts';

import { getTransactionType } from './get-transaction-type.util';
import { isUncategorizedTransaction } from './is-uncategorized-transaction.util';

import type { ColorPaletteVariant } from '../../@generic/type/color-palette-variant.type';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const getTransactionInfoHeroIconVariant = (transaction: TransactionWithRelationsEntityInterface): ColorPaletteVariant => {
    if (isUncategorizedTransaction(transaction)) {
        return 'secondary';
    }

    const transactionType = getTransactionType(transaction);

    if (transactionType === TransactionTypeEnum.INCOME) {
        return 'positive';
    }

    if (transactionType === TransactionTypeEnum.TRANSFER) {
        return 'default';
    }

    return 'secondary';
};
