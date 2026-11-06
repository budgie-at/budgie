import { ExternalSourceEnum, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useContext } from 'react';

import { isDefined } from '@rnw-community/shared';

import { TransactionAccountTitlePrefixContext } from '../context/transaction-account-title-prefix.context';
import { getTransactionDisplayTitle } from '../utils/get-transaction-display-title.util';
import { isInzhurExactDividend } from '../utils/is-inzhur-exact-dividend.util';
import { stripTransactionAccountTitlePrefix } from '../utils/strip-transaction-account-title-prefix.util';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const useTransactionRowTitle = (transaction: TransactionWithRelationsEntityInterface, accountId: number | null) => {
    const { t } = useLingui();
    const accountTitlePrefix = useContext(TransactionAccountTitlePrefixContext);

    const isOwnFundEstimatedDividend =
        isDefined(accountId) &&
        transaction.type === TransactionTypeEnum.INCOME &&
        transaction.externalSource === ExternalSourceEnum.INZHUR &&
        transaction.fundAccountId === accountId &&
        !isInzhurExactDividend(transaction);
    const title = getTransactionDisplayTitle(transaction);

    return isOwnFundEstimatedDividend ? t`Estimated dividends` : (stripTransactionAccountTitlePrefix(title, accountTitlePrefix) ?? title);
};
