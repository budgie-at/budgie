import { convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';

interface Props {
    readonly spent: number;
    readonly limit: number;
    readonly currencySymbol: string;
    readonly spentTestID: string;
}

export const BudgetLimitAmountsRow = ({ spent, limit, currencySymbol, spentTestID }: Props) => {
    const formatDigits = useDisplayFormatDigits();
    const { t } = useLingui();
    const remainingAmount = limit - spent;
    const remainingLabel = remainingAmount < 0 ? t`Over budget` : t`Left`;

    return (
        <View className="flex-row justify-between gap-x-md">
            <View className="flex-1">
                <Text className="text-secondary-foreground text-xs">{t`Spent`}</Text>
                <ProtectedText testID={spentTestID} className="text-primary text-sm font-semibold tabular-nums">
                    {formatDigits(convertFromMicroUnits(spent), currencySymbol)}
                </ProtectedText>
            </View>
            <View className="flex-1 items-center">
                <Text className="text-secondary-foreground text-xs">{remainingLabel}</Text>
                <ProtectedText className="text-primary text-sm font-semibold tabular-nums">
                    {formatDigits(convertFromMicroUnits(Math.abs(remainingAmount)), currencySymbol)}
                </ProtectedText>
            </View>
            <View className="flex-1 items-end">
                <Text className="text-secondary-foreground text-xs">{t`Limit`}</Text>
                <ProtectedText className="text-primary text-sm font-semibold tabular-nums">
                    {formatDigits(convertFromMicroUnits(limit), currencySymbol)}
                </ProtectedText>
            </View>
        </View>
    );
};
