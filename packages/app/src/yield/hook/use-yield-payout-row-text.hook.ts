import { TransactionTypeEnum, YieldKindEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { useFormatDate } from '../../i18n/hook/use-format-date.hook';
import { getTransactionDisplayTitle } from '../../transaction/utils/get-transaction-display-title.util';
import { YIELD_KIND_LABEL } from '../constant/yield-kind-label.constant';

import { useFormatYieldPayoutAmount } from './use-format-yield-payout-amount.hook';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const useYieldPayoutRowText = (
    transaction: TransactionWithRelationsEntityInterface,
    tax: TransactionWithRelationsEntityInterface | null,
    siblings: readonly TransactionWithRelationsEntityInterface[],
    isFullDate: boolean
) => {
    const { t } = useLingui();
    const { formatMonthAndDay, formatDayAndMonthAndYear } = useFormatDate();
    const formatPayoutAmount = useFormatYieldPayoutAmount();

    const kind = transaction.yieldKind ?? YieldKindEnum.NONE;
    const isTax = kind === YieldKindEnum.TAX;
    const isMerged = isNotEmptyArray(siblings);
    const taxAmount = isDefined(tax) ? formatPayoutAmount(tax, true) : '';
    const account = transaction.type === TransactionTypeEnum.EXPENSE ? transaction.fromAccount : transaction.toAccount;
    const kindLabel = t(YIELD_KIND_LABEL[kind]);
    const baseTitle = getTransactionDisplayTitle(transaction) || kindLabel;
    const payoutCount = siblings.length;
    const lastDay = isFullDate ? formatDayAndMonthAndYear(transaction.operatedAt) : formatMonthAndDay(transaction.operatedAt);
    const firstDay = formatMonthAndDay(siblings.at(-1)?.operatedAt ?? transaction.operatedAt);
    const dayLabel = isMerged ? t`${firstDay} – ${lastDay}` : lastDay;

    return {
        kind,
        isTax,
        isMerged,
        title: isMerged ? t`${baseTitle} · ${payoutCount} payouts` : baseTitle,
        subtitle: [dayLabel, baseTitle.toLowerCase().includes(kindLabel.toLowerCase()) ? null : kindLabel, account?.title]
            .filter(isNotEmptyString)
            .join(' · '),
        trailingText: formatPayoutAmount(transaction, isTax, siblings),
        taxText: isDefined(tax) ? t`${taxAmount} tax` : ''
    };
};
