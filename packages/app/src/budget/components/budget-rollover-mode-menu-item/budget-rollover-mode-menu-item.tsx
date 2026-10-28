import { BudgetRolloverModeEnum, UserIconNameEnum } from '@budgie/contracts';

import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { useActionsMenuClose } from '../../../@generic/context/actions-menu.context';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly label: string;
    readonly mode: BudgetRolloverModeEnum;
    readonly onChange: (mode: BudgetRolloverModeEnum) => void;
    readonly selectedMode: BudgetRolloverModeEnum;
}

export const BudgetRolloverModeMenuItem = ({ icon, label, mode, onChange, selectedMode }: Props) => {
    const closeMenu = useActionsMenuClose();
    const itemIcon = mode === selectedMode ? UserIconNameEnum.Check : icon;

    const handlePress = () => {
        onChange(mode);
        closeMenu();
    };

    return <PopoverMenuItem icon={itemIcon} label={label} onPress={handlePress} />;
};
