import { TransactionTypeEnum, convertFromMicroUnits } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { getShare } from '../../../@generic/utils/get-share.util';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useFormatPercent } from '../../../i18n/hook/use-format-percent.hook';

import type { StatisticsDrillDownSummaryInterface } from '../../interface/statistics-drill-down-summary.interface';

interface Props {
    readonly summary: StatisticsDrillDownSummaryInterface;
    readonly type: TransactionTypeEnum.INCOME | TransactionTypeEnum.EXPENSE;
    readonly currencySymbol: string;
}

export const StatisticsDrillDownCaption = ({ summary, type, currencySymbol }: Props) => {
    const { t } = useLingui();
    const isAmountProtected = useIsAmountProtected();
    const formatPercent = useFormatPercent();
    const formatProtectedAmount = useProtectedAmountLabel();
    const { formatFullMonth } = useFormatDate();

    const getLabel = () => {
        if (isDefined(summary.nettedRefund) && summary.amount === 0) {
            const refundLabel = formatProtectedAmount(convertFromMicroUnits(summary.nettedRefund.amount), currencySymbol);
            const purchaseMonth = formatFullMonth(summary.nettedRefund.purchasedAt);

            return t`${refundLabel} refund · netted against the ${purchaseMonth} purchase`;
        }

        if (summary.transactionCount === 0) {
            return t`Nothing booked in this period`;
        }

        const shareLabel = isAmountProtected ? '••%' : formatPercent(getShare(summary.amount, summary.base));
        const countLabel = t({ message: plural(summary.transactionCount, { one: '# transaction', other: '# transactions' }) });
        const shareText = type === TransactionTypeEnum.INCOME ? t`${shareLabel} of income` : t`${shareLabel} of spending`;

        return `${countLabel} · ${shareText}`;
    };

    return <Text className="text-sm text-secondary-foreground">{getLabel()}</Text>;
};
