import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { DEBT_REMAINING_LABEL } from '../../constant/debt-remaining-label.constant';
import { DEBT_SETTLED_LABEL } from '../../constant/debt-settled-label.constant';
import { useDebtAccountCard } from '../../context/debt-account-card.context';

import { DebtAccountCardSummarySelector } from './debt-account-card-summary.selector';

export const DebtAccountCardSummary = () => {
    const { debtType, instrumentSymbol, summary, title } = useDebtAccountCard();
    const { t } = useLingui();
    const formatDigits = useDisplayFormatDigits();

    const fractionCaption = `${t(DEBT_SETTLED_LABEL[debtType])} / ${t`Total`}`;

    return (
        <View className="flex-row flex-wrap items-end justify-between gap-x-md gap-y-sm">
            <View className="min-w-[55%] shrink grow gap-y-xxs">
                <Text className="text-secondary-foreground text-xxs" numberOfLines={2}>
                    {t(DEBT_REMAINING_LABEL[debtType])}
                </Text>
                <ProtectedText
                    adjustsFontSizeToFit
                    className="text-primary font-medium tabular-nums"
                    minimumFontScale={0.85}
                    numberOfLines={1}
                    testID={DebtAccountCardSummarySelector.OutstandingAmount(title, summary.outstandingAmount)}
                >
                    {formatDigits(summary.outstandingAmount, instrumentSymbol)}
                </ProtectedText>
            </View>

            <View className="grow items-end gap-y-[2px]">
                <Text className="text-secondary-foreground text-xxs text-right" numberOfLines={2}>
                    {fractionCaption}
                </Text>
                <ProtectedText
                    className="text-secondary-foreground text-xxs font-medium text-right tabular-nums"
                    numberOfLines={1}
                    testID={DebtAccountCardSummarySelector.PaidAmount(title, summary.paidAmount)}
                >
                    {formatDigits(summary.paidAmount, instrumentSymbol)}
                </ProtectedText>
                <View className="h-px w-full bg-secondary-corner" />
                <ProtectedText
                    className="text-primary text-xxs font-semibold text-right tabular-nums"
                    numberOfLines={1}
                    testID={DebtAccountCardSummarySelector.TotalAmount(title, summary.totalAmount)}
                >
                    {formatDigits(summary.totalAmount, instrumentSymbol)}
                </ProtectedText>
            </View>
        </View>
    );
};
