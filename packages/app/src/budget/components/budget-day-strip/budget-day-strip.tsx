import { BudgetPeriodEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { EntranceReveal } from '../../../@generic/component/entrance-reveal/entrance-reveal';
import { BUDGET_DAY_STRIP_STAGGER_SPAN } from '../../constant/budget-day-strip-motion.constant';
import { BudgetDayStateEnum } from '../../enum/budget-day-state.enum';
import { useBudgetDayStripLabels } from '../../hooks/use-budget-day-strip-labels.hook';
import { buildBudgetDayStripCells } from '../../utils/build-budget-day-strip-cells.util';
import { BudgetDayStripCell } from '../budget-day-strip-cell/budget-day-strip-cell';
import { BudgetDayStripKey } from '../budget-day-strip-key/budget-day-strip-key';

import type { BudgetProjectionInterface } from '@budgie/budget';

interface Props {
    readonly projection: BudgetProjectionInterface;
    readonly period: BudgetPeriodEnum;
    readonly currencySymbol: string;
}

export const BudgetDayStrip = ({ projection, period, currencySymbol }: Props) => {
    const { elapsedDays, totalDays } = projection;
    const dayCells = buildBudgetDayStripCells(projection, period);
    const { accessibilityLabel, captionLabel } = useBudgetDayStripLabels(projection, period, dayCells, currencySymbol);
    const todayIndex = dayCells.findIndex(cell => cell.dayState === BudgetDayStateEnum.TODAY);
    const accessibilityValue = { min: 1, max: totalDays, now: elapsedDays };

    return (
        <EntranceReveal step={1} className="gap-y-md">
            <View
                accessible
                accessibilityRole="progressbar"
                accessibilityLabel={accessibilityLabel}
                accessibilityValue={accessibilityValue}
                className="flex-row items-center gap-x-[3px]"
            >
                {dayCells.map(({ key, dayState }, index) => {
                    const fillDelay = (index / Math.max(todayIndex, 1)) * BUDGET_DAY_STRIP_STAGGER_SPAN;

                    return <BudgetDayStripCell key={key} dayState={dayState} fillDelay={fillDelay} />;
                })}
            </View>

            <BudgetDayStripKey />

            <Text className="text-xs text-secondary-foreground">{captionLabel}</Text>
        </EntranceReveal>
    );
};
