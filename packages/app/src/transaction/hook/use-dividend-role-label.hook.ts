import { ExternalSourceEnum, InstrumentTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { INZHUR_UNATTRIBUTED_DIVIDEND_TITLE } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { isInzhurExactDividend } from '../utils/is-inzhur-exact-dividend.util';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const useDividendRoleLabel = (transaction: TransactionWithRelationsEntityInterface, accountId: number | null) => {
    const { t } = useLingui();

    if (transaction.type !== TransactionTypeEnum.INCOME) {
        return null;
    }

    if (transaction.externalSource === ExternalSourceEnum.INZHUR && isDefined(transaction.fundAccountId)) {
        const isOwnFund = transaction.fundAccountId === accountId;

        if (isInzhurExactDividend(transaction)) {
            return isOwnFund ? t`Dividends` : null;
        }

        return isOwnFund ? t`Estimated` : t`Dividends · estimated`;
    }

    const bankTitle = transaction.entries.find(entry => entry.account.instrument.type !== InstrumentTypeEnum.FUND)?.account.title;
    const isBankDividend = isDefined(transaction.fundAccountId) || transaction.title === INZHUR_UNATTRIBUTED_DIVIDEND_TITLE;

    if (!isBankDividend || !isDefined(bankTitle)) {
        return null;
    }

    return t`Paid to your bank · ${bankTitle}`;
};
