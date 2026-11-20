import { useLingui } from '@lingui/react/macro';
import { use } from 'react';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { HapticPressFeedbackEnum } from '../../../@generic/enum/haptic-press-feedback.enum';
import { cn } from '../../../@generic/utils/cn.util';
import { YIELD_GROUP_LABEL } from '../../constant/yield-group-label.constant';
import { YIELD_LEGEND_ROW_HEIGHT } from '../../constant/yield-legend-row-height.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { YieldSelectionContext } from '../../context/yield-selection.context';
import { useYieldLegendAmounts } from '../../hook/use-yield-legend-amounts.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldLegendEntry } from '../yield-legend-entry/yield-legend-entry';

import type { YieldGroupEnum } from '@budgie/market';

const ROW_STYLE = { minHeight: YIELD_LEGEND_ROW_HEIGHT };
const AMOUNT_CLASSNAME = 'text-right text-sm font-semibold tabular-nums text-primary';
const DIMMED_AMOUNT_CLASSNAME = 'text-right text-sm tabular-nums text-secondary-foreground';
const ROW_HIT_SLOP = { top: 2, bottom: 2 };

interface Props {
    readonly group: YieldGroupEnum;
    readonly total: number;
    readonly share: number;
    readonly isCompact: boolean;
    readonly onPress: (group: YieldGroupEnum) => void;
}

export const YieldLegendRow = ({ group, total, share, isCompact, onPress }: Props) => {
    const { t } = useLingui();
    const { screenKey } = use(YieldScreenContext);
    const { selectedIndex } = use(YieldSelectionContext);

    const hasFilter = isDefined(screenKey.key.group);
    const isSelected = screenKey.key.group === group;
    const isDimmed = hasFilter && !isSelected;
    const isEmpty = isDefined(selectedIndex) && !isPositiveNumber(total);
    const { exact: exactAmount, amount, share: formattedShare } = useYieldLegendAmounts(total, share, isCompact, isEmpty);
    const label = t(YIELD_GROUP_LABEL[group]);
    const shareText = hasFilter && !isEmpty ? formattedShare : null;
    const amountClassName = isDimmed ? DIMMED_AMOUNT_CLASSNAME : AMOUNT_CLASSNAME;
    const rowClassName = cn(
        'w-full',
        'flex-row',
        'items-center',
        'gap-x-[8px]',
        'rounded-full',
        'px-sm',
        'py-xs',
        isSelected && 'bg-secondary-background'
    );
    const accessibilityState = { selected: isSelected };

    const handlePress = () => void onPress(group);

    return (
        <HapticPressable
            accessibilityRole="button"
            accessibilityState={accessibilityState}
            accessibilityLabel={t`${label}, ${exactAmount}`}
            accessibilityHint={t`Filters the screen by this kind`}
            pressFeedback={HapticPressFeedbackEnum.SELECTION}
            onPress={handlePress}
            testID={PassiveIncomeSelector.LegendRow(group)}
            className={rowClassName}
            style={ROW_STYLE}
            hitSlop={ROW_HIT_SLOP}
        >
            <YieldLegendEntry
                group={group}
                label={label}
                amount={amount}
                amountClassName={amountClassName}
                share={shareText}
                isMuted={isDimmed}
                isEmpty={isEmpty}
            />
        </HapticPressable>
    );
};
