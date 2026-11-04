import { UserIconNameEnum, isIncomeTransaction } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { ActionsMenuItem } from '../../../@generic/component/actions-menu-item/actions-menu-item';
import { useConvertToRefundModal } from '../../context/convert-to-refund-modal.context';
import { TransactionListContextMenuSelector } from '../transaction-list-context-menu/transaction-list-context-menu.selector';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionListConvertToRefundMenuItem = ({ transaction }: Props) => {
    const { t } = useLingui();
    const [openConvertToRefund] = useConvertToRefundModal();

    const isConsolidated = isDefined(transaction.consolidationType);
    const isRefunded = isDefined(transaction.consolidationParentTransactionId);
    const isVisible = !isConsolidated && !isRefunded && isIncomeTransaction(transaction);

    if (!isVisible) {
        return null;
    }

    const handleConvert = () => {
        openConvertToRefund({ refundIncomeTransactionId: transaction.id });
    };

    return (
        <ActionsMenuItem
            icon={UserIconNameEnum.ReceiptText}
            label={t`Convert to Refund`}
            onPress={handleConvert}
            testID={TransactionListContextMenuSelector.ConvertToRefundButton}
        />
    );
};
