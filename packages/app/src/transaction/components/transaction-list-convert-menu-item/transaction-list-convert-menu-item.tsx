import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { TransactionListContextMenuSelector } from '../transaction-list-context-menu/transaction-list-context-menu.selector';

import type { TransactionListConvertMenuItemPropsInterface } from '../../interface/transaction-list-convert-menu-item-props.interface';

export const TransactionListConvertMenuItem = ({ isVisible, onConvert }: TransactionListConvertMenuItemPropsInterface) => {
    const { t } = useLingui();

    if (!isVisible) {
        return null;
    }

    return (
        <PopoverMenuItem
            icon={UserIconNameEnum.ArrowRightLeft}
            label={t`Convert to Transfer`}
            onPress={onConvert}
            testID={TransactionListContextMenuSelector.ConvertToTransferButton}
        />
    );
};
