import { UserIconType } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { IconSelectorModalSelector } from '../../../app/icon-selector-modal.selector';
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

export const IconSelectorCard = ({ isSelected, icon, label, onSelect }: Props) => {
    const { t } = useLingui();
    const handleSelect = () => void onSelect(icon);
    const accessibilityState = { selected: isSelected };

    return (
        <HapticPressable
            testID={IconSelectorModalSelector.IconCard(icon)}
            accessibilityRole="button"
            accessibilityLabel={getIconChoiceLabel(icon, label, t)}
            accessibilityState={accessibilityState}
            className="aspect-square flex-1 items-center justify-center rounded-3xl bg-surface-disc active:opacity-70"
            onPress={handleSelect}
        >
            <Icon className="text-primary" icon={icon} size={28} />

            {isSelected ? <IconSelectedIndicator /> : null}
        </HapticPressable>
    );
};
