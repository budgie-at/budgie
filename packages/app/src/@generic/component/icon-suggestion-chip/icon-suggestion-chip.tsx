import { isEmojiIcon, UserIconType } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { EMOJI_TILE_BACKGROUND } from '../../constant/emoji-tile-background.constant';
import { TONAL_DISC_BACKGROUND } from '../../constant/tonal-disc-background.constant';
import { cn } from '../../utils/cn.util';
import { getIconChoiceLabel } from '../../utils/get-icon-choice-label.util';
import { CircleIcon } from '../circle-icon/circle-icon';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { IconSelectedIndicator } from '../icon-selected-indicator/icon-selected-indicator';

interface Props {
    readonly icon: UserIconType;
    readonly label: string;
    readonly isSelected: boolean;
    readonly onSelect: (icon: UserIconType) => void;
    readonly testID?: string;
}

export const IconSuggestionChip = ({ icon, label, isSelected, onSelect, testID }: Props) => {
    const { t } = useLingui();
    const handlePress = () => void onSelect(icon);
    const discClassName = cn(TONAL_DISC_BACKGROUND.secondary, isEmojiIcon(icon) && EMOJI_TILE_BACKGROUND);
    const accessibilityState = { selected: isSelected };

    return (
        <HapticPressable
            onPress={handlePress}
            accessibilityRole="button"
            accessibilityLabel={getIconChoiceLabel(icon, label, t)}
            accessibilityState={accessibilityState}
            className="active:opacity-70"
            testID={testID}
        >
            <CircleIcon icon={icon} variant="secondary" size={52} iconSize={22} radius={16} border={false} className={discClassName} />

            {isSelected ? <IconSelectedIndicator /> : null}
        </HapticPressable>
    );
};
