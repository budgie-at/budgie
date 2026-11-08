import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
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

export const ActionItemButton = ({ icon, label, testID, variant, onPress }: Props) => (
    <HapticPressable onPress={onPress} testID={testID} collapsable={false}>
        <ActionItemLabel icon={icon} label={label} testID={testID} variant={variant} />
    </HapticPressable>
);
