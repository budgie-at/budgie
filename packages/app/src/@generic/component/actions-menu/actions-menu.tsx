import { View } from 'react-native';

import { ActionsMenuContext } from '../../context/actions-menu.context';
import { usePopoverMenuAnchor } from '../../hook/use-popover-menu-anchor.hook';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { PopoverMenu } from '../popover-menu/popover-menu';

import type { ReactNode } from 'react';
import type { Insets } from 'react-native';

interface Props {
    readonly trigger: ReactNode;
    readonly accessibilityLabel: string;
    readonly isDisabled?: boolean;
    readonly triggerClassName?: string;
    readonly triggerTestID?: string;
    readonly children: ReactNode;
    readonly hitSlop?: Insets | number;
}

const DEFAULT_HIT_SLOP = 12;

export const ActionsMenu = ({
    trigger,
    accessibilityLabel,
    isDisabled = false,
    triggerClassName,
    triggerTestID,
    children,
    hitSlop = DEFAULT_HIT_SLOP
}: Props) => {
    const { anchor, closeMenu, handleCloseComplete, handleToggleMenu, isMenuOpen } = usePopoverMenuAnchor();

    return (
        <ActionsMenuContext value={closeMenu}>
            <View collapsable={false} testID={triggerTestID}>
                <HapticPressable
                    className={triggerClassName}
                    onPress={handleToggleMenu}
                    hitSlop={hitSlop}
                    disabled={isDisabled}
                    accessibilityRole="button"
                    accessibilityLabel={accessibilityLabel}
                    nativeID={triggerTestID}
                >
                    {trigger}
                </HapticPressable>
            </View>

            <PopoverMenu isOpen={isMenuOpen} onClose={closeMenu} onCloseComplete={handleCloseComplete} anchor={anchor}>
                <View className="py-sm">{children}</View>
            </PopoverMenu>
        </ActionsMenuContext>
    );
};
