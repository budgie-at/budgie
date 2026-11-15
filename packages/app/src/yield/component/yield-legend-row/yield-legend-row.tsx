import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { use } from 'react';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { HapticPressFeedbackEnum } from '../../../@generic/enum/haptic-press-feedback.enum';
import { useIsIncreaseContrast } from '../../../@generic/hook/use-is-increase-contrast.hook';
import { useIsLargeText } from '../../../@generic/hook/use-is-large-text.hook';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { YIELD_GROUP_COLOR } from '../../constant/yield-group-color.constant';
import { YIELD_GROUP_LABEL } from '../../constant/yield-group-label.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';

import type { YieldGroupEnum } from '@budgie/market';

interface Props {
    readonly group: YieldGroupEnum;
    readonly total: number;
    readonly onPress: (group: YieldGroupEnum) => void;
}

export const YieldLegendRow = ({ group, total, onPress }: Props) => {
    const { t } = useLingui();
    const { screenKey } = use(YieldScreenContext);
    const isIncreaseContrast = useIsIncreaseContrast();
    const isLargeText = useIsLargeText();
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
        'py-xs',
        isLargeText && 'w-full',
        !isLargeText && 'w-1/2',
        isDimmed && 'opacity-40'
    );
    const accessibilityState = { selected: isSelected };

    const handlePress = () => void onPress(group);

    return (
        <HapticPressable
            accessibilityRole="button"
            accessibilityState={accessibilityState}
            accessibilityLabel={t`${label}, ${amount}`}
            pressFeedback={HapticPressFeedbackEnum.SELECTION}
            onPress={handlePress}
            testID={PassiveIncomeSelector.LegendRow(group)}
            className={rowClassName}
        >
            <View className={cn('h-[10px] w-[10px] rounded-full', dotClassName)} />
            <Text numberOfLines={1} className="flex-1 text-sm text-primary">
                {label}
            </Text>
            <Text numberOfLines={1} className="text-sm font-semibold tabular-nums text-primary">
                {amount}
            </Text>
        </HapticPressable>
    );
};
