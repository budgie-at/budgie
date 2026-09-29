import { UserIconType } from '@budgie/contracts';

import { CircleIcon } from '../circle-icon/circle-icon';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';

interface Props {
    readonly icon: UserIconType;
    readonly onSelect: (icon: UserIconType) => void;
    readonly testID?: string;
}

export const IconSuggestionChip = ({ icon, onSelect, testID }: Props) => {
    const handlePress = () => void onSelect(icon);

    return (
        <HapticPressable onPress={handlePress} testID={testID}>
            <CircleIcon icon={icon} variant="default" size={44} iconSize={22} radius={16} />
        </HapticPressable>
    );
};
