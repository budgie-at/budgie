import { convertFromMicroUnits } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';

import type { BudgetSinkingFundEntityInterface } from '@budgie/contracts';

interface Props {
    readonly fund: Pick<BudgetSinkingFundEntityInterface, 'name' | 'fundedAmount' | 'targetAmount'>;
    readonly currencySymbol: string;
}

export const BudgetFundRowHeader = ({ fund, currencySymbol }: Props) => {
    const formatDigits = useFormatDigits(0);
    const fundedLabel = formatDigits(convertFromMicroUnits(fund.fundedAmount), currencySymbol);
    const targetLabel = formatDigits(convertFromMicroUnits(fund.targetAmount), currencySymbol);

    return (
        <View className="flex-row items-baseline justify-between gap-x-md">
            <Text numberOfLines={1} className="shrink text-sm font-medium text-primary">
                {fund.name}
            </Text>
            <View className="flex-row items-baseline gap-x-xs">
                <ProtectedText className="text-sm font-semibold tabular-nums text-primary">{fundedLabel}</ProtectedText>
                <ProtectedText className="text-sm tabular-nums text-secondary-foreground">/ {targetLabel}</ProtectedText>
            </View>
        </View>
    );
};
