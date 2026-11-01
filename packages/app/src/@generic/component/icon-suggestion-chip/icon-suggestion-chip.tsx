import { UserIconType } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';

import { TONAL_DISC_BACKGROUND } from '../../constant/tonal-disc-background.constant';
import { CircleIcon } from '../circle-icon/circle-icon';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';

interface Props {
    readonly icon: UserIconType;
    readonly label: string;
    readonly isSelected: boolean;
    readonly onSelect: (icon: UserIconType) => void;
    readonly testID?: string;
}

const discVariants = cva(TONAL_DISC_BACKGROUND.secondary, {
    variants: {
        isSelected: {
            true: 'border-2 border-primary',
            false: ''
        }
    }
});

export const IconSuggestionChip = ({ icon, label, isSelected, onSelect, testID }: Props) => {
    const { t } = useLingui();
    const handlePress = () => void onSelect(icon);
    const accessibilityState = { selected: isSelected };

    return (
        <HapticPressable
            onPress={handlePress}
            accessibilityRole="button"
            accessibilityLabel={t`Use ${label} icon`}
            accessibilityState={accessibilityState}
            className="active:opacity-70"
            testID={testID}
        >
            <CircleIcon
                icon={icon}
                variant="secondary"
                size={44}
                iconSize={20}
                radius={16}
                border={false}
                className={discVariants({ isSelected })}
            />
        </HapticPressable>
    );
};
