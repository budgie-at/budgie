import { UserIconType } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { TONAL_DISC_BACKGROUND } from '../../constant/tonal-disc-background.constant';
import { CircleIcon } from '../circle-icon/circle-icon';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';

interface Props {
    readonly icon: UserIconType;
    readonly label: string;
    readonly onSelect: (icon: UserIconType) => void;
    readonly testID?: string;
}

export const IconSuggestionChip = ({ icon, label, onSelect, testID }: Props) => {
    const { t } = useLingui();
    const handlePress = () => void onSelect(icon);

    return (
        <HapticPressable
            onPress={handlePress}
            accessibilityRole="button"
            accessibilityLabel={t`Use ${label} icon`}
            className="active:opacity-70"
            testID={testID}
        >
            <CircleIcon
                icon={icon}
                variant="default"
                size={44}
                iconSize={20}
                radius={16}
                border={false}
                className={TONAL_DISC_BACKGROUND.default}
            />
        </HapticPressable>
    );
};
