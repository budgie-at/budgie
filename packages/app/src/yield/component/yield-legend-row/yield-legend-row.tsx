import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { use } from 'react';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { HapticPressFeedbackEnum } from '../../../@generic/enum/haptic-press-feedback.enum';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { YIELD_GROUP_LABEL } from '../../constant/yield-group-label.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { YieldSelectionContext } from '../../context/yield-selection.context';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldLegendEntry } from '../yield-legend-entry/yield-legend-entry';

import type { YieldGroupEnum } from '@budgie/market';

const EMPTY_AMOUNT = '—';
const AMOUNT_CLASSNAME = 'text-sm font-semibold tabular-nums text-primary';

interface Props {
    readonly group: YieldGroupEnum;
    readonly total: number;
    readonly isFullWidth: boolean;
    readonly onPress: (group: YieldGroupEnum) => void;
}

export const YieldLegendRow = ({ group, total, isFullWidth, onPress }: Props) => {
    const { t } = useLingui();
    const { screenKey } = use(YieldScreenContext);
    const { selectedIndex } = use(YieldSelectionContext);
    const formatAmount = useProtectedAmountLabel();
    const { symbol } = useAtomValue(defaultInstrumentAtom);

    const isSelected = screenKey.key.group === group;
    const label = t(YIELD_GROUP_LABEL[group]);
    const isEmpty = isDefined(selectedIndex) && !isPositiveNumber(total);
    const amount = isEmpty ? EMPTY_AMOUNT : formatAmount(total, symbol);
    const isDimmed = isDefined(screenKey.key.group) && !isSelected;
    const rowClassName = cn(
        'min-h-[44px]',
        'flex-row',
        'items-center',
        'gap-x-[8px]',
        'rounded-full',
        'px-sm',
        'py-xs',
        isFullWidth ? 'w-full' : 'w-1/2',
        isSelected && 'bg-secondary-background',
        isEmpty && 'opacity-40'
    );
    const accessibilityState = { selected: isSelected };

    const handlePress = () => void onPress(group);

    return (
        <HapticPressable
            accessibilityRole="button"
            accessibilityState={accessibilityState}
            accessibilityLabel={t`${label}, ${amount}`}
            accessibilityHint={t`Filters the screen by this kind`}
            pressFeedback={HapticPressFeedbackEnum.SELECTION}
            onPress={handlePress}
            testID={PassiveIncomeSelector.LegendRow(group)}
            className={rowClassName}
        >
            <YieldLegendEntry group={group} label={label} amount={amount} amountClassName={AMOUNT_CLASSNAME} isDotMuted={isDimmed} />
        </HapticPressable>
    );
};
