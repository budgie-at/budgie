import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { useTransactionActionsMenu } from '../../context/transaction-actions-menu.context';

import type { TransactionConvertMenuItemPropsInterface } from '../../interface/transaction-convert-menu-item-props.interface';

export const TransactionConvertMenuItem = ({ icon, label, onConvert, testID }: TransactionConvertMenuItemPropsInterface) => {
    const closeMenu = useTransactionActionsMenu();

    const handlePress = () => {
        closeMenu(onConvert);
    };

    return <PopoverMenuItem icon={icon} label={label} onPress={handlePress} testID={testID} />;
};
