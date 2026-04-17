import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { EmptyFn } from '@rnw-community/shared';

import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { useTransactionActionsMenu } from '../transaction-actions-menu/transaction-actions-menu';
import { TransactionActionsMenuSelector } from '../transaction-actions-menu/transaction-actions-menu.selector';

interface Props {
    readonly onConvert: EmptyFn;
}

export const ConvertToTransferMenuItem = ({ onConvert }: Props) => {
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
