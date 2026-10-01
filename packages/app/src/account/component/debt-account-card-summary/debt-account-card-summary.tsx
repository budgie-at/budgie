import { AccountDebtTypeEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { ClassValue, cn } from 'cn';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';

import { DebtAccountCardSummarySelector } from './debt-account-card-summary.selector';

interface Props {
    readonly debtType: AccountDebtTypeEnum;
    readonly instrumentSymbol: string;
    readonly outstandingAmount: number;
    readonly percentage: number;
    readonly title: string;
    readonly totalAmount: number;
}

const PERCENTAGE_COLOR: Record<AccountDebtTypeEnum, ClassValue> = {
    [AccountDebtTypeEnum.BORROW]: 'text-destructive-foreground',
    [AccountDebtTypeEnum.LENT]: 'text-positive-foreground'
};

export const DebtAccountCardSummary = ({ debtType, instrumentSymbol, outstandingAmount, percentage, title, totalAmount }: Props) => {
    const formatDigits = useDisplayFormatDigits();

    const amountColorClassName = isPositiveNumber(outstandingAmount) ? 'text-primary' : 'text-secondary-foreground';

    return (
        <View className="max-w-[55%] shrink-0 items-end gap-y-xxs">
            <ProtectedText
                adjustsFontSizeToFit
                className={cn('text-lg font-semibold tracking-tight tabular-nums', amountColorClassName)}
                minimumFontScale={0.7}
                numberOfLines={1}
                testID={DebtAccountCardSummarySelector.OutstandingAmount(title, outstandingAmount)}
            >
                {formatDigits(outstandingAmount, instrumentSymbol)}
            </ProtectedText>

            <View className="flex-row items-baseline gap-x-xs">
                <View className="min-w-0 shrink flex-row items-baseline gap-x-xxs">
                    <Text className="text-xxs text-secondary-foreground">
                        <Trans>of</Trans>
                    </Text>

                    <ProtectedText
                        adjustsFontSizeToFit
                        className="shrink text-xxs text-secondary-foreground tabular-nums"
                        minimumFontScale={0.7}
                        numberOfLines={1}
                        testID={DebtAccountCardSummarySelector.TotalAmount(title, totalAmount)}
                    >
                        {formatDigits(totalAmount, instrumentSymbol)}
                    </ProtectedText>
                </View>

                <Text
                    className={cn('shrink-0 text-xxs font-semibold tabular-nums', PERCENTAGE_COLOR[debtType])}
                    numberOfLines={1}
                    testID={DebtAccountCardSummarySelector.Percentage(title, percentage)}
                >
                    {`${percentage}%`}
                </Text>
            </View>
        </View>
    );
};
