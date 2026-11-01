import { isEmojiIcon, UserIconType } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';

import { IconSelectorModalSelector } from '../../../app/icon-selector-modal.selector';
import { EMOJI_TILE_BACKGROUND } from '../../constant/emoji-tile-background.constant';
import { getIconChoiceLabel } from '../../utils/get-icon-choice-label.util';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { IconSelectedIndicator } from '../icon-selected-indicator/icon-selected-indicator';
import { Icon } from '../icon/icon';

interface Props {
    readonly onSelect: (icon: UserIconType) => void;
    readonly label: string;
    readonly isSelected: boolean;
    readonly icon: UserIconType;
}

const tileVariants = cva('aspect-square flex-1 items-center justify-center rounded-3xl bg-surface-disc active:opacity-70', {
    variants: { isEmoji: { true: EMOJI_TILE_BACKGROUND, false: '' } }
});

export const IconSelectorCard = ({ isSelected, icon, label, onSelect }: Props) => {
    const { t } = useLingui();
    const handleSelect = () => void onSelect(icon);
    const accessibilityState = { selected: isSelected };
    const glyphClassName = isSelected ? 'text-primary' : 'text-primary/80';

    return (
        <HapticPressable
            testID={IconSelectorModalSelector.IconCard(icon)}
            accessibilityRole="button"
            accessibilityLabel={getIconChoiceLabel(icon, label, t)}
            accessibilityState={accessibilityState}
            className={tileVariants({ isEmoji: isEmojiIcon(icon) })}
            onPress={handleSelect}
        >
            <Icon className={glyphClassName} icon={icon} size={24} />

            {isSelected ? <IconSelectedIndicator /> : null}
        </HapticPressable>
    );
};
