import { InstrumentTypeEnum, YieldKindEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { use } from 'react';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { useFormatDate } from '../../i18n/hook/use-format-date.hook';
import { getTransactionDisplayTitle } from '../../transaction/utils/get-transaction-display-title.util';
import { YIELD_KIND_LABEL } from '../constant/yield-kind-label.constant';
import { YieldScreenContext } from '../context/yield-screen.context';
import { YieldPayoutDateFormatEnum } from '../enum/yield-payout-date-format.enum';
import { buildYieldPayoutLabels } from '../utils/build-yield-payout-labels.util';
import { formatYieldDayRange } from '../utils/format-yield-day-range.util';
import { getYieldPayoutAccount } from '../utils/get-yield-payout-account.util';

import { useFormatYieldPayoutAmount } from './use-format-yield-payout-amount.hook';
import { useYieldSummary } from './use-yield-summary.hook';

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
    const summary = useYieldSummary();
    const formatPayoutAmount = useFormatYieldPayoutAmount();

    const kind = transaction.yieldKind ?? YieldKindEnum.NONE;
    const isTax = kind === YieldKindEnum.TAX;
    const isMerged = isNotEmptyArray(siblings);
    const isScoped = isDefined(screenKey.key.positionAccountId);
    const account = getYieldPayoutAccount(transaction);
    const kindLabel = t(YIELD_KIND_LABEL[kind]);
    const formatDay = dateFormat === YieldPayoutDateFormatEnum.DAY_MONTH_YEAR ? formatDayAndMonthAndYear : formatMonthAndDay;
    const taxAmount = isDefined(tax) ? formatPayoutAmount(tax, true) : '';
    const { title, subtitle } = buildYieldPayoutLabels({
        isMerged,
        isScoped,
        positionTitle: isScoped
            ? null
            : (summary?.positions.find(position => position.accountId === (transaction.yieldSourceAccountId ?? account?.id))?.title ??
              null),
        sourceTitle: isScoped ? '' : (account?.title ?? ''),
        baseTitle: getTransactionDisplayTitle(transaction) || kindLabel,
        kindLabel,
        dayLabel: isMerged
            ? formatYieldDayRange(siblings.at(-1)?.operatedAt ?? transaction.operatedAt, transaction.operatedAt, formatMonthAndDay)
            : formatDay(transaction.operatedAt),
        fullDayLabel: formatDayAndMonthAndYear(transaction.operatedAt),
        countLabel: t({ message: plural(siblings.length, { one: '# payout', other: '# payouts' }) })
    });

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
