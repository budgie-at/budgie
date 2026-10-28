import { useActionsMenuClose } from '../../context/actions-menu.context';
import { PopoverMenuItem } from '../popover-menu-item/popover-menu-item';

import type { ComponentProps } from 'react';

export const ActionsMenuItem = ({ onPress, ...props }: ComponentProps<typeof PopoverMenuItem>) => {
    const closeMenu = useActionsMenuClose();

    const handlePress = () => void closeMenu(onPress);

    return <PopoverMenuItem {...props} onPress={handlePress} />;
};
