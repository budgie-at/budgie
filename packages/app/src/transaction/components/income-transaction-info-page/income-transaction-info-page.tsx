import { TransactionTypeEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { dismissAllOrReplace } from '../../../@generic/utils/dismiss-all-or-replace.util';
import { useConvertToTransferModal } from '../../context/convert-to-transfer-modal.context';
import { useDeleteTransaction } from '../../hook/use-delete-transaction.hook';
import { useOpenRefundConvert } from '../../hook/use-open-refund-convert.hook';
import { useRevertConsolidation } from '../../hook/use-revert-consolidation.hook';
import { getTransactionCategoryEntries } from '../../utils/get-transaction-category-entries.util';
import { TransactionInfoPage } from '../transaction-info-page/transaction-info-page';

import type { UpdateTransactionFormPropsInterface } from '../../interface/update-transaction-form-props.interface';

export const IncomeTransactionInfoPage = ({ transaction }: UpdateTransactionFormPropsInterface) => {
    const deleteTransaction = useDeleteTransaction();
    const [openConvertToTransfer] = useConvertToTransferModal();
    const isConsolidated = isDefined(transaction.consolidationType);
    const transactionId = transaction.id;
    const categoryEntries = getTransactionCategoryEntries(transaction.entries);
    const handleRevert = useRevertConsolidation(transactionId, () => void dismissAllOrReplace('/'));
    const canConvertToRefund = !isConsolidated && !isDefined(transaction.consolidationParentTransactionId);
    const handleDelete = () => deleteTransaction(transactionId, { isConsolidated });
    const handleOpenConvert = () => {
        const sourceEntry = categoryEntries.at(0);

        if (!isDefined(sourceEntry)) {
            return;
        }

        void openConvertToTransfer({
            transactionId,
            transactionType: TransactionTypeEnum.INCOME,
            excludeAccountId: transaction.toAccountId ?? 0,
            sourceAmount: convertFromMicroUnits(sourceEntry.amount),
            sourceInstrumentId: sourceEntry.account.instrumentId,
            sourceCode: sourceEntry.account.instrument.code
        });
    };
    const handleOpenRefundConvert = useOpenRefundConvert(transactionId);
    const refundConvertProps = canConvertToRefund ? { onConvertToRefund: handleOpenRefundConvert } : {};
    const transferConvertProps = categoryEntries.length === 1 ? { onConvertToTransfer: handleOpenConvert } : {};
    const editHref = `/transactions/${transactionId}/income/edit` as const;

    return (
        <TransactionInfoPage
            transaction={transaction}
            editHref={editHref}
            onDelete={handleDelete}
            onRevert={handleRevert}
            {...refundConvertProps}
            {...transferConvertProps}
        />
    );
};
