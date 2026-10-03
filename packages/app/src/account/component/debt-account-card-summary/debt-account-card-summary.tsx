import { Trans } from '@lingui/react/macro';
import { cn } from 'cn';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

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

    const amountColorClassName = isPositiveNumber(outstandingAmount) ? 'text-primary' : 'text-secondary-foreground';

    return (
        <View className="max-w-[55%] shrink-0 items-end gap-y-xxs">
            <ProtectedText
                adjustsFontSizeToFit
                className={cn('text-xl font-semibold tracking-tight tabular-nums', amountColorClassName)}
                minimumFontScale={0.7}
                numberOfLines={1}
                testID={DebtAccountCardSummarySelector.OutstandingAmount(title, outstandingAmount)}
            >
                {formatDigits(outstandingAmount, instrumentSymbol)}
            </ProtectedText>

            <View className="min-w-0 shrink flex-row items-baseline gap-x-xxs">
                <Text className="text-xs text-secondary-foreground">
                    <Trans>of</Trans>
                </Text>

                <ProtectedText
                    adjustsFontSizeToFit
                    className="shrink text-xs text-secondary-foreground tabular-nums"
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
