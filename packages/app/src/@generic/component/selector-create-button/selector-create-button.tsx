import { UserIconNameEnum } from '@budgie/contracts';

import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

interface Props {
    readonly label: string;
    readonly onPress: () => void;
    readonly testID?: string;
}

export const SelectorCreateButton = ({ label, onPress, testID }: Props) => (
    <HapticPressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        className="h-[40px] w-[40px] items-center justify-center rounded-full bg-surface-fill active:opacity-70"
        testID={testID}
    >
        <Icon icon={UserIconNameEnum.Plus} size={20} className="text-primary" />
    </HapticPressable>
);
