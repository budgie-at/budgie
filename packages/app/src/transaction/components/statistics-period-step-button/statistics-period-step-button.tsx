import { UserIconNameEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';

import type { DateRangeInterface } from '@budgie/contracts';

interface Props {
    readonly icon: UserIconNameEnum.ChevronLeft | UserIconNameEnum.ChevronRight;
    readonly range: DateRangeInterface | null;
    readonly accessibilityLabel: string;
    readonly onChange: (range: DateRangeInterface) => void;
}

export const StatisticsPeriodStepButton = ({ icon, range, accessibilityLabel, onChange }: Props) => {
    const isDisabled = !isDefined(range);
    const accessibilityState = { disabled: isDisabled };
    const handlePress = () => {
        if (isDefined(range)) {
            onChange(range);
        }
    };

    return (
        <HapticPressable
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            accessibilityState={accessibilityState}
            disabled={isDisabled}
            hitSlop={0}
            className={cn('size-[44px] items-center justify-center', isDisabled && 'opacity-30')}
            onPress={handlePress}
        >
            <Icon icon={icon} size={20} className="text-primary" />
        </HapticPressable>
    );
};
