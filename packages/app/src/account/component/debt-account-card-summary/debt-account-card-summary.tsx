import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';

import { DebtAccountCardSummarySelector } from './debt-account-card-summary.selector';

interface Props {
    readonly instrumentSymbol: string;
    readonly outstandingAmount: number;
    readonly title: string;
    readonly totalAmount: number;
}

export const DebtAccountCardSummary = ({ instrumentSymbol, outstandingAmount, title, totalAmount }: Props) => {
    const formatDigits = useDisplayFormatDigits();

    return (
        <View>
            <ProtectedText
                adjustsFontSizeToFit
                className="text-primary text-xl font-semibold tracking-tight tabular-nums"
                minimumFontScale={0.7}
                numberOfLines={1}
                testID={DebtAccountCardSummarySelector.OutstandingAmount(title, outstandingAmount)}
            >
                {formatDigits(outstandingAmount, instrumentSymbol)}
            </ProtectedText>

            <View className="flex-row items-baseline gap-x-xxs">
                <Text className="text-secondary-foreground text-xxs">
                    <Trans>of</Trans>
                </Text>

                <ProtectedText
                    adjustsFontSizeToFit
                    className="text-secondary-foreground text-xxs shrink tabular-nums"
                    minimumFontScale={0.7}
                    numberOfLines={1}
                    testID={DebtAccountCardSummarySelector.TotalAmount(title, totalAmount)}
                >
                    {formatDigits(totalAmount, instrumentSymbol)}
                </ProtectedText>
            </View>
        </View>
    );
};
