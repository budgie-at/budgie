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

const EMPTY_AMOUNT = '—';
const AMOUNT_CLASSNAME = 'text-right text-sm font-semibold tabular-nums text-primary';

interface Props {
    readonly group: YieldGroupEnum;
    readonly total: number;
    readonly share: number;
    readonly onPress: (group: YieldGroupEnum) => void;
}

export const YieldLegendRow = ({ group, total, share, onPress }: Props) => {
    const { t } = useLingui();
    const { screenKey } = use(YieldScreenContext);
    const { selectedIndex } = use(YieldSelectionContext);

    const isSelected = screenKey.key.group === group;
    const isDimmed = isDefined(screenKey.key.group) && !isSelected;
    const amounts = useYieldLegendAmounts(total, share, isDimmed);
    const label = t(YIELD_GROUP_LABEL[group]);
    const isEmpty = isDefined(selectedIndex) && !isPositiveNumber(total);
    const exactAmount = isEmpty ? EMPTY_AMOUNT : amounts.exact;
    const amount = isEmpty ? EMPTY_AMOUNT : amounts.shown;
    const rowClassName = cn(
        'w-full',
        'flex-row',
        'items-center',
        'gap-x-[8px]',
        'rounded-full',
        'px-sm',
        'py-xs',
        isSelected && 'bg-secondary-background',
        isEmpty && 'opacity-40'
    );
    const accessibilityState = { selected: isSelected };
    const rowStyle = { minHeight: YIELD_LEGEND_ROW_HEIGHT };

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
            style={rowStyle}
        >
            <YieldLegendEntry group={group} label={label} amount={amount} amountClassName={AMOUNT_CLASSNAME} isMuted={isDimmed} />
        </HapticPressable>
    );
};
