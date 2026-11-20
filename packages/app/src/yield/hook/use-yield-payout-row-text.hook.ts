import { InstrumentTypeEnum, TransactionTypeEnum, YieldKindEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { use } from 'react';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { useFormatDate } from '../../i18n/hook/use-format-date.hook';
import { getTransactionDisplayTitle } from '../../transaction/utils/get-transaction-display-title.util';
import { YIELD_KIND_LABEL } from '../constant/yield-kind-label.constant';
import { YieldScreenContext } from '../context/yield-screen.context';
import { YieldPayoutDateFormatEnum } from '../enum/yield-payout-date-format.enum';
import { formatYieldDayRange } from '../utils/format-yield-day-range.util';
import { joinYieldSubtitle } from '../utils/join-yield-subtitle.util';

import { useFormatYieldPayoutAmount } from './use-format-yield-payout-amount.hook';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const useYieldPayoutRowText = (
    transaction: TransactionWithRelationsEntityInterface,
    tax: TransactionWithRelationsEntityInterface | null,
    siblings: readonly TransactionWithRelationsEntityInterface[],
    dateFormat: YieldPayoutDateFormatEnum
) => {
    const { t } = useLingui();
    const { screenKey } = use(YieldScreenContext);
    const { formatMonthAndDay, formatDayAndMonthAndYear } = useFormatDate();
    const formatPayoutAmount = useFormatYieldPayoutAmount();

    const kind = transaction.yieldKind ?? YieldKindEnum.NONE;
    const isTax = kind === YieldKindEnum.TAX;
    const isMerged = isNotEmptyArray(siblings);
    const taxAmount = isDefined(tax) ? formatPayoutAmount(tax, true) : '';
    const account = transaction.type === TransactionTypeEnum.EXPENSE ? transaction.fromAccount : transaction.toAccount;
    const sourceTitle = isDefined(screenKey.key.positionAccountId) ? '' : (account?.title ?? '');
    const kindLabel = t(YIELD_KIND_LABEL[kind]);
    const baseTitle = getTransactionDisplayTitle(transaction) || kindLabel;
    const dayLabel = isMerged
        ? formatYieldDayRange(siblings.at(-1)?.operatedAt ?? transaction.operatedAt, transaction.operatedAt, formatMonthAndDay)
        : (dateFormat === YieldPayoutDateFormatEnum.DAY_MONTH_YEAR ? formatDayAndMonthAndYear : formatMonthAndDay)(transaction.operatedAt);

    const countLabel = t({ message: plural(siblings.length, { one: '# payout', other: '# payouts' }) });

    return {
        kind,
        cryptoCode: isMerged && account?.instrument.type === InstrumentTypeEnum.CRYPTO ? account.instrument.code : null,
        isTax,
        isMerged,
        title: isMerged && isNotEmptyString(sourceTitle) ? sourceTitle : baseTitle,
        subtitle: isMerged
            ? joinYieldSubtitle([countLabel, dayLabel])
            : joinYieldSubtitle([dayLabel, baseTitle.toLowerCase().includes(kindLabel.toLowerCase()) ? null : kindLabel, sourceTitle]),
        trailingText: formatPayoutAmount(transaction, isTax, siblings),
        taxText: isDefined(tax) ? t`${taxAmount} tax` : ''
    };
};
