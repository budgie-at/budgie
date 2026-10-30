import { ImpactFeedbackStyle } from 'expo-haptics';
import { Pressable } from 'react-native';

import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { ActionItemLabel } from '../action-item-label/action-item-label';

import type { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import type { UserIconNameEnum } from '@budgie/contracts';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly label: string;
    readonly testID?: string;
    readonly variant: ColorPaletteVariant;
    readonly onPress: () => void;
}

export const ActionItemButton = ({ icon, label, testID, variant, onPress }: Props) => {
    const [, hapticImpact] = useVibration();

    const handlePress = () => {
        hapticImpact(ImpactFeedbackStyle.Medium);
        onPress();
    };

    return (
        <Pressable hitSlop={10} onPress={handlePress} testID={testID} collapsable={false}>
            <ActionItemLabel icon={icon} label={label} testID={testID} variant={variant} />
        </Pressable>
    );
};
