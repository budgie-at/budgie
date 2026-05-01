import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { useTransactionActionsMenu } from '../../context/transaction-actions-menu.context';
import { TransactionActionsMenuSelector } from '../transaction-actions-menu/transaction-actions-menu.selector';

import type { ConvertToTransferMenuItemPropsInterface } from '../../interface/convert-to-transfer-menu-item-props.interface';

export const ConvertToTransferMenuItem = ({ onConvert }: ConvertToTransferMenuItemPropsInterface) => {
    const { t } = useLingui();
    const closeMenu = useTransactionActionsMenu();

    const handlePress = () => {
        closeMenu(onConvert);
    };

    return (
        <PopoverMenuItem
            icon={UserIconNameEnum.ArrowRightLeft}
            label={t`Convert to Transfer`}
            onPress={handlePress}
            testID={TransactionActionsMenuSelector.ConvertToTransferButton}
        />
    );
};
