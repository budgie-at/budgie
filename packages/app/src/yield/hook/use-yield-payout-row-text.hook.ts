import { InstrumentTypeEnum, TransactionTypeEnum, YieldKindEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { YieldPayoutDateFormatEnum } from '../enum/yield-payout-date-format.enum';

import { useFormatYieldPayoutAmount } from './use-format-yield-payout-amount.hook';
import { useYieldPayoutRowLabels } from './use-yield-payout-row-labels.hook';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const useYieldPayoutRowText = (
    transaction: TransactionWithRelationsEntityInterface,
    tax: TransactionWithRelationsEntityInterface | null,
    siblings: readonly TransactionWithRelationsEntityInterface[],
    dateFormat: YieldPayoutDateFormatEnum
) => {
    const { t } = useLingui();
    const formatPayoutAmount = useFormatYieldPayoutAmount();
    const { title, subtitle } = useYieldPayoutRowLabels(transaction, siblings, dateFormat);

    const kind = transaction.yieldKind ?? YieldKindEnum.NONE;
    const isTax = kind === YieldKindEnum.TAX;
    const isMerged = isNotEmptyArray(siblings);
    const taxAmount = isDefined(tax) ? formatPayoutAmount(tax, true) : '';
    const account = transaction.type === TransactionTypeEnum.EXPENSE ? transaction.fromAccount : transaction.toAccount;

    return {
        kind,
        cryptoCode: isMerged && account?.instrument.type === InstrumentTypeEnum.CRYPTO ? account.instrument.code : null,
        isTax,
        isMerged,
        title,
        subtitle,
        trailingText: formatPayoutAmount(transaction, isTax, siblings),
        taxText: isDefined(tax) ? t`${taxAmount} tax` : ''
    };
};
