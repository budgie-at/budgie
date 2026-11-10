import { UserIconNameEnum, isIncomeTransaction, type TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { ActionsMenuItem } from '../../../@generic/component/actions-menu-item/actions-menu-item';
import { useOpenModal } from '../../../@generic/hook/use-open-modal/use-open-modal.hook';
import { TransactionListContextMenuSelector } from '../transaction-list-context-menu/transaction-list-context-menu.selector';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionListConvertToRefundMenuItem = ({ transaction }: Props) => {
    const { t } = useLingui();
    const openConvertToRefund = useOpenModal('/convert-to-refund');

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
