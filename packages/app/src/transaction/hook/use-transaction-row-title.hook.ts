import { TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useContext } from 'react';

import { isListedSecurityType } from '../../instrument/utils/is-listed-security-type.util';
import { TransactionAccountTitlePrefixContext } from '../context/transaction-account-title-prefix.context';
import { getEnableBankingTransactionDisplayTitle } from '../utils/get-enable-banking-transaction-display-title.util';
import { stripTransactionAccountTitlePrefix } from '../utils/strip-transaction-account-title-prefix.util';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const useTransactionRowTitle = (transaction: TransactionWithRelationsEntityInterface) => {
    const { t } = useLingui();
    const accountTitlePrefix = useContext(TransactionAccountTitlePrefixContext);
    const title = getEnableBankingTransactionDisplayTitle(transaction);
    const securityEntry = transaction.entries.find(
        entry => isListedSecurityType(entry.account.instrument.type) && entry.account.instrument.symbol === title
    );

    if (transaction.type === TransactionTypeEnum.TRANSFER && securityEntry?.accountId === transaction.toAccountId) {
        return t`Buy ${title}`;
    }

    if (transaction.type === TransactionTypeEnum.TRANSFER && securityEntry?.accountId === transaction.fromAccountId) {
        return t`Sell ${title}`;
    }

    return stripTransactionAccountTitlePrefix(title, accountTitlePrefix) ?? title;
};
