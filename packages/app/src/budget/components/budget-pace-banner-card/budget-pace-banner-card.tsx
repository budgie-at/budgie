import { BudgetPaceStatusEnum } from '@budgie/budget';
import { UserIconNameEnum, convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { BudgetSelector } from '../../budget.selector';
import { BUDGET_PACE_ICON } from '../../constant/budget-pace-icon.constant';

import type { BudgetProjectionScopeInterface } from '@budgie/budget';

interface Props {
    readonly title: string;
    readonly scope: BudgetProjectionScopeInterface;
    readonly currencySymbol: string;
    readonly onPress: () => void;
}

const ICON_SIZE = 20;

export const BudgetPaceBannerCard = ({ title, scope, currencySymbol, onPress }: Props) => {
    const { t } = useLingui();
    const formatProtectedAmount = useProtectedAmountLabel();

    const perDayAmount = formatProtectedAmount(convertFromMicroUnits(scope.safePerDay), currencySymbol);
    const limitAmount = formatProtectedAmount(convertFromMicroUnits(scope.limit), currencySymbol);
    const headline = t`${title} is ahead of pace`;
    const detail = t`Keep under ${perDayAmount}/day to stay within ${limitAmount}`;

    return (
        <HapticPressable
            accessibilityLabel={`${headline}. ${detail}`}
            accessibilityRole="button"
            className="flex-row items-center gap-x-md rounded-3xl border border-warning-corner bg-warning-background p-lg"
            testID={BudgetSelector.DetailsPaceBanner}
            onPress={onPress}
        >
            <Icon icon={BUDGET_PACE_ICON[BudgetPaceStatusEnum.AHEAD]} size={ICON_SIZE} className="text-warning-foreground" />
            <View className="flex-1 gap-y-xs">
                <Text className="text-sm font-semibold text-warning-foreground">{headline}</Text>
                <Text className="text-xs text-secondary-foreground">{detail}</Text>
            </View>
            <Icon icon={UserIconNameEnum.ChevronRight} size={ICON_SIZE} className="text-warning-foreground" />
        </HapticPressable>
    );
};
