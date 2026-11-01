import { convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { BudgetSelector } from '../../budget.selector';

import type { BudgetFundSuggestionInterface } from '../../interface/budget-fund-suggestion.interface';

interface Props {
    readonly suggestion: BudgetFundSuggestionInterface;
    readonly currencySymbol: string;
    readonly onUse: (suggestion: BudgetFundSuggestionInterface) => void;
}

export const BudgetFundSuggestionBanner = ({ suggestion, currencySymbol, onUse }: Props) => {
    const { t } = useLingui();
    const formatDigits = useFormatDigits(0);
    const { name } = suggestion;
    const amountLabel = formatDigits(convertFromMicroUnits(suggestion.targetAmount), currencySymbol);

    const handleUse = () => {
        onUse(suggestion);
    };

    return (
        <View className="flex-row items-center justify-between gap-x-md">
            <Text className="flex-1 text-sm text-primary">{t`From your recurring charges: ${name}, ${amountLabel} per cycle`}</Text>
            <HapticPressable
                accessibilityRole="button"
                className="min-h-[44px] justify-center px-md active:opacity-70"
                testID={BudgetSelector.FundSuggestionUseButton}
                onPress={handleUse}
            >
                <Text className="text-md font-semibold text-default-foreground">{t`Use`}</Text>
            </HapticPressable>
        </View>
    );
};
