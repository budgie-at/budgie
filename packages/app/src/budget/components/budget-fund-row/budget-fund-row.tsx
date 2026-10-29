import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { useToday } from '../../../@generic/hook/use-today.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { BudgetSelector } from '../../budget.selector';
import { computeFundTimeFraction } from '../../utils/compute-fund-time-fraction.util';
import { isFundBehind } from '../../utils/is-fund-behind.util';
import { BudgetFundRowHeader } from '../budget-fund-row-header/budget-fund-row-header';
import { BudgetFundRowStatus } from '../budget-fund-row-status/budget-fund-row-status';
import { BudgetLimitBar } from '../budget-limit-bar/budget-limit-bar';

import type { BudgetEntityInterface, BudgetSinkingFundEntityInterface } from '@budgie/contracts';

interface Props {
    readonly fund: BudgetSinkingFundEntityInterface;
    readonly budget: BudgetEntityInterface;
    readonly currencySymbol: string;
}

export const BudgetFundRow = ({ fund, budget, currencySymbol }: Props) => {
    const { t } = useLingui();
    const today = useToday();
    const { formatMonthAndDay } = useFormatDate();
    const barTone = isFundBehind(fund, today) ? 'warning' : 'positive';
    const dueDate = formatMonthAndDay(fund.dueAt);
    const dueLabel = t`Due ${dueDate}`;

    const handlePress = () => {
        router.push({ pathname: '/budget-fund-form', params: { id: String(fund.id) } });
    };

    return (
        <HapticPressable
            accessibilityRole="button"
            className="min-h-[44px] gap-y-sm active:opacity-70"
            testID={BudgetSelector.DetailsFundRow(fund.id)}
            onPress={handlePress}
        >
            <BudgetFundRowHeader fund={fund} currencySymbol={currencySymbol} />
            <Text className="text-xs text-secondary-foreground">{dueLabel}</Text>
            <BudgetLimitBar
                spent={fund.fundedAmount}
                limit={fund.targetAmount}
                tone={barTone}
                elapsedFraction={computeFundTimeFraction(fund, today)}
            />
            <BudgetFundRowStatus fund={fund} budget={budget} currencySymbol={currencySymbol} />
        </HapticPressable>
    );
};
