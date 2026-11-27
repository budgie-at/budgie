import { useLingui } from '@lingui/react/macro';
import { use } from 'react';
import { View } from 'react-native';

import { isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { HapticPressFeedbackEnum } from '../../../@generic/enum/haptic-press-feedback.enum';
import { cn } from '../../../@generic/utils/cn.util';
import { YIELD_GROUP_LABEL } from '../../constant/yield-group-label.constant';
import { YIELD_LEGEND_ROW_HEIGHT } from '../../constant/yield-legend-row-height.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { YieldSelectionContext } from '../../context/yield-selection.context';
import { useYieldGroupColor } from '../../hook/use-yield-group-color.hook';
import { useYieldLegendAmounts } from '../../hook/use-yield-legend-amounts.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldLegendEntry } from '../yield-legend-entry/yield-legend-entry';

import type { YieldGroupEnum } from '@budgie/market';

const ROW_STYLE = { minHeight: YIELD_LEGEND_ROW_HEIGHT };
const ROW_CLASSNAME = 'w-full flex-row items-center gap-x-[8px] rounded-[12px] px-sm py-xs';
const SELECTION_CLASSNAME = 'absolute inset-y-0 inset-x-[2px] rounded-[12px] opacity-10';
const ROW_HIT_SLOP = { top: 2, bottom: 2 };

interface Props {
    readonly group: YieldGroupEnum;
    readonly total: number;
    readonly share: number | null;
    readonly isCompact: boolean;
    readonly onPress: (group: YieldGroupEnum) => void;
}

export const YieldLegendRow = ({ group, total, share, isCompact, onPress }: Props) => {
    const { t } = useLingui();
    const { screenKey } = use(YieldScreenContext);
    const { selectedIndex } = use(YieldSelectionContext);

    const isSelected = screenKey.key.group === group;
    const isDimmed = isDefined(screenKey.key.group) && !isSelected;
    const isEmpty = isDefined(selectedIndex) && !isPositiveNumber(total);
    const { exact: exactAmount, amount, share: formattedShare } = useYieldLegendAmounts(total, share ?? 0, isCompact, isEmpty);
    const { background } = useYieldGroupColor(group);
    const label = t(YIELD_GROUP_LABEL[group]);
    const shareText = isEmpty || !isDefined(share) ? null : formattedShare;
    const spokenAmount = isEmpty ? t`no income` : exactAmount;
    const accessibilityLabel = isNotEmptyString(shareText) ? t`${label}, ${spokenAmount}, ${shareText}` : t`${label}, ${spokenAmount}`;
    const accessibilityState = { selected: isSelected };

    const handlePress = () => void onPress(group);

    return (
        <HapticPressable
            accessibilityRole="button"
            accessibilityState={accessibilityState}
            accessibilityLabel={accessibilityLabel}
            accessibilityHint={t`Filters the screen by this kind`}
            pressFeedback={HapticPressFeedbackEnum.SELECTION}
            onPress={handlePress}
            testID={PassiveIncomeSelector.LegendRow(group)}
            className={ROW_CLASSNAME}
            style={ROW_STYLE}
            hitSlop={ROW_HIT_SLOP}
        >
            {isSelected ? <View pointerEvents="none" className={cn(SELECTION_CLASSNAME, background)} /> : null}
            <YieldLegendEntry group={group} label={label} amount={amount} share={shareText} isMuted={isDimmed} isEmpty={isEmpty} />
        </HapticPressable>
    );
};
