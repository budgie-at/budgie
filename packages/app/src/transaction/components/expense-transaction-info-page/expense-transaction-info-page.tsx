import { TransactionTypeEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { dismissAllOrReplace } from '../../../@generic/utils/dismiss-all-or-replace.util';
import { useConsolidationSourceModal } from '../../context/consolidation-source-modal.context';
import { useConvertToTransferModal } from '../../context/convert-to-transfer-modal.context';
import { useDeleteTransaction } from '../../hook/use-delete-transaction.hook';
import { useRevertConsolidation } from '../../hook/use-revert-consolidation.hook';
import { getTransactionCategoryEntries } from '../../utils/get-transaction-category-entries.util';
import { TransactionInfoPage } from '../transaction-info-page/transaction-info-page';

import type { UpdateTransactionFormPropsInterface } from '../../interface/update-transaction-form-props.interface';

export const ExpenseTransactionInfoPage = ({ transaction }: UpdateTransactionFormPropsInterface) => {
    const deleteTransaction = useDeleteTransaction();
    const [openConsolidationSourceModal] = useConsolidationSourceModal();
    const [openConvertToTransfer] = useConvertToTransferModal();
    const isConsolidated = isDefined(transaction.consolidationType);
    const transactionId = transaction.id;
    const categoryEntries = getTransactionCategoryEntries(transaction.entries);
    const [sourceEntry] = categoryEntries;
    const handleRevert = useRevertConsolidation(transactionId, () => void dismissAllOrReplace('/'));
    const handleDelete = () => deleteTransaction(transactionId, { isConsolidated });
    const handleOpenRefundSources = () => void openConsolidationSourceModal({ transactionId });
    const handleOpenConvert = () => {
        if (!isDefined(sourceEntry)) {
            return;
        }

        void openConvertToTransfer({
            transactionId,
            transactionType: TransactionTypeEnum.EXPENSE,
            excludeAccountId: transaction.fromAccountId ?? 0,
            sourceAmount: convertFromMicroUnits(sourceEntry.amount),
            sourceInstrumentId: sourceEntry.account.instrumentId,
            sourceCode: sourceEntry.account.instrument.code
        });
    };
    const transferConvertProps = categoryEntries.length === 1 ? { onConvertToTransfer: handleOpenConvert } : {};
    const editHref = `/transactions/${transactionId}/expense/edit` as const;

    return (
        <TransactionInfoPage
            transaction={transaction}
            editHref={editHref}
            onDelete={handleDelete}
            onRevert={handleRevert}
            onOpenRefundSources={handleOpenRefundSources}
            {...transferConvertProps}
        />
    );
};
