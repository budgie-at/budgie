import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { emptyFn } from '@rnw-community/shared';

import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { TransactionListContextMenuSelector } from '../transaction-list-context-menu/transaction-list-context-menu.selector';

import type { EmptyFn } from '@rnw-community/shared';

interface Props {
    readonly isVisible: boolean;
    readonly isRefund?: boolean;
    readonly onConvert: EmptyFn;
}

export const TransactionListConvertMenuItem = ({ isVisible, isRefund, onConvert }: Props) => {
    const { t } = useLingui();

    if (!isVisible) {
        return null;
    }

    const icon = isRefund ? UserIconNameEnum.ReceiptText : UserIconNameEnum.ArrowRightLeft;
    const label = isRefund ? t`Convert to Refund` : t`Convert to Transfer`;
    const testID = isRefund
        ? TransactionListContextMenuSelector.ConvertToRefundButton
        : TransactionListContextMenuSelector.ConvertToTransferButton;

    return <PopoverMenuItem icon={icon} label={label} onPress={emptyFn} onPressIn={onConvert} testID={testID} />;
};
