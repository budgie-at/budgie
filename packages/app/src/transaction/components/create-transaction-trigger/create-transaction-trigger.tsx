import { UserIconNameEnum } from '@budgie/contracts';
import { ImpactFeedbackStyle } from 'expo-haptics/src/Haptics.types';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';

const TRIGGER_ICON_SIZE = 32;

interface Props {
    readonly isOpen: boolean;
    readonly onPress: () => void;
}

export const CreateTransactionTrigger = ({ isOpen, onPress }: Props) => {
    const [, hapticImpact] = useVibration();

    const handlePress = () => {
        hapticImpact(ImpactFeedbackStyle.Medium);
        onPress();
    };

    return (
        <HapticPressable
            testID="ActionButton"
            className="bg-primary rounded-full items-center justify-center w-18 h-18"
            {...(!isOpen && { onPress: handlePress })}
        >
            <Icon className="text-primary-reverse" icon={UserIconNameEnum.Plus} size={TRIGGER_ICON_SIZE} />
        </HapticPressable>
    );
};
