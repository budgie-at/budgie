import { UserIconNameEnum, isIncomeTransaction } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { useConvertToRefundModal } from '../../context/convert-to-refund-modal.context';
import { useTransactionListContextMenu } from '../../context/transaction-list-context-menu.context';
import { TransactionListContextMenuSelector } from '../transaction-list-context-menu/transaction-list-context-menu.selector';

export const TransactionListConvertToRefundMenuItem = () => {
    const { t } = useLingui();
    const { transaction, closeMenu } = useTransactionListContextMenu();
    const [openConvertToRefund] = useConvertToRefundModal();

    const isConsolidated = isDefined(transaction.consolidationType);
    const isRefunded = isDefined(transaction.consolidationParentTransactionId);
    const isVisible = !isConsolidated && !isRefunded && isIncomeTransaction(transaction);

    if (!isVisible) {
        return null;
    }

    const handleConvert = () => {
        closeMenu(() => {
            openConvertToRefund({ refundIncomeTransactionId: transaction.id }).catch(emptyFn);
        });
    };

    return (
        <PopoverMenuItem
            icon={UserIconNameEnum.ReceiptText}
            label={t`Convert to Refund`}
            onPress={emptyFn}
            onPressIn={handleConvert}
            testID={TransactionListContextMenuSelector.ConvertToRefundButton}
        />
    );
};
