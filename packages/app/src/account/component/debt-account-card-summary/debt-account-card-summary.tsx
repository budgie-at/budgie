import { Text, View } from 'react-native';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useDebtAccountCard } from '../../context/debt-account-card.context';

import { DebtAccountCardSummarySelector } from './debt-account-card-summary.selector';

export const DebtAccountCardSummary = () => {
    const { instrumentSymbol, settledLabel, summary, title } = useDebtAccountCard();
    const formatDigits = useDisplayFormatDigits();

    return (
        <View className="gap-y-xxs">
            <ProtectedText
                adjustsFontSizeToFit
                className="text-primary font-medium tabular-nums"
                minimumFontScale={0.85}
                numberOfLines={1}
                testID={DebtAccountCardSummarySelector.OutstandingAmount(title, summary.outstandingAmount)}
            >
                {formatDigits(summary.outstandingAmount, instrumentSymbol)}
            </ProtectedText>

            <View className="flex-row items-baseline gap-x-xxs">
                <Text
                    className="text-secondary-foreground text-xxs shrink"
                    numberOfLines={1}
                    testID={DebtAccountCardSummarySelector.SettledLabel(title)}
                >
                    {settledLabel}
                </Text>

                <ProtectedText
                    adjustsFontSizeToFit
                    className="text-secondary-foreground text-xxs shrink font-medium tabular-nums"
                    minimumFontScale={0.7}
                    numberOfLines={1}
                    testID={DebtAccountCardSummarySelector.PaidAmount(title, summary.paidAmount)}
                >
                    {formatDigits(summary.paidAmount, instrumentSymbol)}
                </ProtectedText>

                <Text className="text-secondary-foreground text-xxs">/</Text>

                <ProtectedText
                    adjustsFontSizeToFit
                    className="text-secondary-foreground text-xxs shrink font-medium tabular-nums"
                    minimumFontScale={0.7}
                    numberOfLines={1}
                    testID={DebtAccountCardSummarySelector.TotalAmount(title, summary.totalAmount)}
                >
                    {formatDigits(summary.totalAmount, instrumentSymbol)}
                </ProtectedText>
            </View>
        </View>
    );
};
