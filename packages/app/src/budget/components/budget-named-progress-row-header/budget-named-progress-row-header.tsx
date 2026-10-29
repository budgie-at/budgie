import { convertFromMicroUnits } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';

interface Props {
    readonly name: string;
    readonly amount: number;
    readonly limit: number;
    readonly currencySymbol: string;
    readonly amountTestID?: string;
}

export const BudgetNamedProgressRowHeader = ({ name, amount, limit, currencySymbol, amountTestID }: Props) => {
    const formatDigits = useFormatDigits(0);
    const amountLabel = formatDigits(convertFromMicroUnits(amount), currencySymbol);
    const limitLabel = formatDigits(convertFromMicroUnits(limit), currencySymbol);

    return (
        <View className="flex-row items-baseline justify-between gap-x-md">
            <Text numberOfLines={1} className="shrink text-sm font-medium text-primary">
                {name}
            </Text>
            <View className="flex-row items-baseline gap-x-xs">
                <ProtectedText testID={amountTestID} className="text-sm font-semibold tabular-nums text-primary">
                    {amountLabel}
                </ProtectedText>
                <ProtectedText className="text-sm tabular-nums text-secondary-foreground">/ {limitLabel}</ProtectedText>
            </View>
        </View>
    );
};
