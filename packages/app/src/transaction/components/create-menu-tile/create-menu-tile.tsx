import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { createMenuButtonAccessibility } from '../../utils/create-menu-button-accessibility.util';
import { CreateMenuTileContent } from '../create-menu-tile-content/create-menu-tile-content';

import type { CreateMenuItemPropsInterface } from '../../interface/create-menu-item-props.interface';

export const CreateMenuTile = ({ icon, label, testID, variant, onPress }: CreateMenuItemPropsInterface) => (
    <HapticPressable className="flex-1" collapsable={false} onPress={onPress} testID={testID} {...createMenuButtonAccessibility(label)}>
        <CreateMenuTileContent icon={icon} label={label} testID={testID} variant={variant} />
    </HapticPressable>
);
