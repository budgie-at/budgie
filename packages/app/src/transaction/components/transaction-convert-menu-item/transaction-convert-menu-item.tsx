import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { useTransactionActionsMenu } from '../../context/transaction-actions-menu.context';

import type { UserIconNameEnum } from '@budgie/contracts';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly label: string;
    readonly onConvert: () => void;
    readonly testID: string;
}

export const TransactionConvertMenuItem = ({ icon, label, onConvert, testID }: Props) => {
    const closeMenu = useTransactionActionsMenu();

    const handlePress = () => {
        closeMenu(onConvert);
    };

    return <PopoverMenuItem icon={icon} label={label} onPress={handlePress} testID={testID} />;
};
