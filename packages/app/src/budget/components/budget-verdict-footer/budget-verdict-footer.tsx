import { UserIconNameEnum, convertFromMicroUnits } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { BudgetSelector } from '../../budget.selector';

interface Props {
    readonly upcoming: number;
    readonly count: number;
    readonly currencySymbol: string;
}

const CHEVRON_SIZE = 16;

export const BudgetVerdictFooter = ({ upcoming, count, currencySymbol }: Props) => {
    const { t } = useLingui();
    const formatProtectedAmount = useProtectedAmountLabel();
    const upcomingAmount = formatProtectedAmount(convertFromMicroUnits(upcoming), currencySymbol);
    const billsLabel = t({ message: plural(count, { one: '# upcoming bill', other: '# upcoming bills' }) });
    const label = t`Reserving ${upcomingAmount} for ${billsLabel}`;

    const handlePress = () => void router.push('/budget-safe-to-spend');

    return (
        <HapticPressable
            accessibilityLabel={label}
            accessibilityRole="button"
            className="flex-row items-center justify-between gap-x-md border-t border-secondary-corner pt-lg"
            testID={BudgetSelector.DetailsReservedLink}
            onPress={handlePress}
        >
            <Text className="shrink text-sm text-secondary-foreground">{label}</Text>
            <Icon icon={UserIconNameEnum.ChevronRight} size={CHEVRON_SIZE} className="text-secondary-foreground" />
        </HapticPressable>
    );
};
