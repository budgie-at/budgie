import { getTransactionCategoryEntries } from '@budgie/ledger';

import { isDefined } from '@rnw-community/shared';

import { useConvertToTransferModal } from '../context/convert-to-transfer-modal.context';
import { useTransactionListContextMenu } from '../context/transaction-list-context-menu.context';

export const useTransactionListConvertToTransferBase = () => {
    const { transaction, closeMenu } = useTransactionListContextMenu();
    const [openConvertToTransfer] = useConvertToTransferModal();

    const isConsolidated = isDefined(transaction.consolidationType);
    const categoryEntries = getTransactionCategoryEntries(transaction.entries);

    return { transaction, closeMenu, openConvertToTransfer, isConsolidated, categoryEntries };
};
