import { UserIconNameEnum } from '@budgie/contracts';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly accessibilityLabel: string;
    readonly onPress: () => void;
    readonly testID: string;
}

export const RuleFormRemoveButton = ({ accessibilityLabel, onPress, testID }: Props) => (
    <HapticPressable
        testID={testID}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        className="h-[44px] w-[44px] items-center justify-center active:opacity-60"
    >
        <Icon icon={UserIconNameEnum.CircleMinus} size={20} className="text-secondary-foreground" />
    </HapticPressable>
);
