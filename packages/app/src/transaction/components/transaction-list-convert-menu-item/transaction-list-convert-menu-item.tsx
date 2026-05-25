import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { TransactionListContextMenuSelector } from '../transaction-list-context-menu/transaction-list-context-menu.selector';

import type { TransactionListConvertMenuItemPropsInterface } from '../../interface/transaction-list-convert-menu-item-props.interface';

export const TransactionListConvertMenuItem = ({ isVisible, isRefund, onConvert }: TransactionListConvertMenuItemPropsInterface) => {
    const { t } = useLingui();

    if (!isVisible) {
        return null;
    }

    const icon = isRefund ? UserIconNameEnum.ReceiptText : UserIconNameEnum.ArrowRightLeft;
    const label = isRefund ? t`Convert to Refund` : t`Convert to Transfer`;
    const testID = isRefund
        ? TransactionListContextMenuSelector.ConvertToRefundButton
        : TransactionListContextMenuSelector.ConvertToTransferButton;

    return <PopoverMenuItem icon={icon} label={label} onPress={onConvert} testID={testID} />;
};
