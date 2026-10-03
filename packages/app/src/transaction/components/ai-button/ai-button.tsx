import { UserIconNameEnum } from '@budgie/contracts';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';

interface Props {
    readonly onPress: () => void;
    readonly testID?: string;
}

const ICON_SIZE = 32;
const BUTTON_SIZE = 72;
const CONTAINER_SIZE = 88;
const CONTAINER_STYLE = { height: CONTAINER_SIZE, width: CONTAINER_SIZE };
const BUTTON_STYLE = { width: BUTTON_SIZE, height: BUTTON_SIZE };

export const AiButton = ({ onPress, testID }: Props) => {
    const [, hapticImpact] = useVibration();

    const handlePress = () => {
        hapticImpact(ImpactFeedbackStyle.Medium);
        onPress();
    };

    return (
        <View className="items-center justify-center" style={CONTAINER_STYLE}>
            <HapticPressable
                className="bg-primary rounded-full items-center justify-center shadow-lg shadow-black/30"
                style={BUTTON_STYLE}
                onPress={handlePress}
                testID={testID}
            >
                <Icon className="text-primary-reverse" icon={UserIconNameEnum.Mic} size={ICON_SIZE} />
            </HapticPressable>
        </View>
    );
};
