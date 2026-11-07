import { useContext } from 'react';

import { TransactionAccountTitlePrefixContext } from '../context/transaction-account-title-prefix.context';
import { getTransactionDisplayTitle } from '../utils/get-transaction-display-title.util';
import { stripTransactionAccountTitlePrefix } from '../utils/strip-transaction-account-title-prefix.util';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const useTransactionRowTitle = (transaction: TransactionWithRelationsEntityInterface) => {
    const accountTitlePrefix = useContext(TransactionAccountTitlePrefixContext);
    const title = getTransactionDisplayTitle(transaction);

    return stripTransactionAccountTitlePrefix(title, accountTitlePrefix) ?? title;
};
