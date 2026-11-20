import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { use } from 'react';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { HapticPressFeedbackEnum } from '../../../@generic/enum/haptic-press-feedback.enum';
import { useIsIncreaseContrast } from '../../../@generic/hook/use-is-increase-contrast.hook';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { YIELD_GROUP_COLOR } from '../../constant/yield-group-color.constant';
import { YIELD_GROUP_LABEL } from '../../constant/yield-group-label.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldLegendEntry } from '../yield-legend-entry/yield-legend-entry';

import type { YieldGroupEnum } from '@budgie/market';

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
    const isIncreaseContrast = useIsIncreaseContrast();
    const formatAmount = useProtectedAmountLabel();
    const { symbol } = useAtomValue(defaultInstrumentAtom);

    const isSelected = screenKey.key.group === group;
    const label = t(YIELD_GROUP_LABEL[group]);
    const amount = formatAmount(total, symbol);
    const dotClassName = YIELD_GROUP_COLOR[group][isIncreaseContrast ? 'backgroundContrast' : 'background'];
    const isDimmed = isDefined(screenKey.key.group) && !isSelected;
    const rowClassName = cn(
        'min-h-[44px]',
        'flex-row',
        'items-center',
        'gap-x-sm',
        'rounded-full',
        'px-sm',
        'py-xs',
        isFullWidth ? 'w-full' : 'w-1/2',
        isSelected && 'bg-secondary-background',
        isDimmed && 'opacity-40'
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
            <YieldLegendEntry dotClassName={dotClassName} label={label} amount={amount} amountClassName={AMOUNT_CLASSNAME} />
        </HapticPressable>
    );
};
