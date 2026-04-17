import { UserIconNameEnum } from '@budgie/contracts';
import { ImpactFeedbackStyle } from 'expo-haptics/src/Haptics.types';

import { useVibration } from '../../hook/use-vibration.hook';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

const TRIGGER_ICON_SIZE = 32;

interface Props {
    readonly isOpen: boolean;
    readonly onPress: () => void;
}

// eslint-disable-next-line lingui/no-unlocalized-strings
const testID = 'ActionButton';

export const ActionButton = ({ isOpen, onPress }: Props) => {
    const [, hapticImpact] = useVibration();

    const handlePress = () => {
        hapticImpact(ImpactFeedbackStyle.Medium);
        onPress();
    };

    return (
        <HapticPressable
            testID={testID}
            className="bg-primary rounded-full items-center justify-center w-18 h-18"
            {...(!isOpen && { onPress: handlePress })}
        >
            <Icon className="text-primary-reverse" icon={UserIconNameEnum.Plus} size={TRIGGER_ICON_SIZE} />
        </HapticPressable>
    );
};
