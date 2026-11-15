import { ExternalSourceEnum, InstrumentTypeEnum, TransactionTypeEnum, YieldKindEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const useDividendRoleLabel = (transaction: TransactionWithRelationsEntityInterface) => {
    const { t } = useLingui();

    if (transaction.type !== TransactionTypeEnum.INCOME) {
        return null;
    }

    if (transaction.externalSource === ExternalSourceEnum.INZHUR && isDefined(transaction.fundAccountId)) {
        return null;
    }

    const bankTitle = transaction.entries.find(entry => entry.account.instrument.type !== InstrumentTypeEnum.FUND)?.account.title;

    if (transaction.yieldKind !== YieldKindEnum.DIVIDEND || !isDefined(bankTitle)) {
        return null;
    }

    return t`Paid to your bank · ${bankTitle}`;
};
