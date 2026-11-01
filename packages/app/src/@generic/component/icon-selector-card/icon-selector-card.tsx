import { isEmojiIcon, UserIconType } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';

import { IconSelectorModalSelector } from '../../../app/icon-selector-modal.selector';
import { EMOJI_TILE_BACKGROUND } from '../../constant/emoji-tile-background.constant';
import { FOREGROUND_COLOR_PALETTE } from '../../constant/foreground-color-palette.constant';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { cn } from '../../utils/cn.util';
import { getIconChoiceLabel } from '../../utils/get-icon-choice-label.util';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { IconSelectedIndicator } from '../icon-selected-indicator/icon-selected-indicator';
import { Icon } from '../icon/icon';

interface Props {
    readonly onSelect: (icon: UserIconType) => void;
    readonly variant: ColorPaletteVariant;
    readonly label: string;
    readonly isSelected: boolean;
    readonly icon: UserIconType;
}

const tileVariants = cva('aspect-square flex-1 items-center justify-center rounded-3xl bg-surface-disc active:opacity-70', {
    variants: { isEmoji: { true: EMOJI_TILE_BACKGROUND, false: '' } }
});

export const IconSelectorCard = ({ isSelected, icon, label, onSelect, variant }: Props) => {
    const { t } = useLingui();
    const handleSelect = () => void onSelect(icon);
    const iconClassName = isSelected ? FOREGROUND_COLOR_PALETTE[variant] : FOREGROUND_COLOR_PALETTE.secondary;
    const accessibilityState = { selected: isSelected };

    return (
        <HapticPressable
            testID={IconSelectorModalSelector.IconCard(icon)}
            accessibilityRole="button"
            accessibilityLabel={getIconChoiceLabel(icon, label, t)}
            accessibilityState={accessibilityState}
            className={tileVariants({ isEmoji: isEmojiIcon(icon) })}
            onPress={handleSelect}
        >
            <Icon className={cn(iconClassName)} icon={icon} size={22} />

            {isSelected ? <IconSelectedIndicator /> : null}
        </HapticPressable>
    );
};
