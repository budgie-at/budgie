import { TransactionTypeEnum, UserIconNameEnum, isExpenseTransaction, isIncomeTransaction } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useConvertToTransferModal } from '../../context/convert-to-transfer-modal.context';
import { useTransactionListContextMenu } from '../../context/transaction-list-context-menu.context';
import { getTransactionCategoryEntries } from '../../utils/get-transaction-category-entries.util';
import { TransactionListContextMenuSelector } from '../transaction-list-context-menu/transaction-list-context-menu.selector';

export const TransactionListConvertToTransferMenuItem = () => {
    const { t } = useLingui();
    const { transaction, closeMenu } = useTransactionListContextMenu();
    const [openConvertToTransfer] = useConvertToTransferModal();

    const isConsolidated = isDefined(transaction.consolidationType);
    const categoryEntries = getTransactionCategoryEntries(transaction.entries);
    const isConvertibleTransaction = isExpenseTransaction(transaction) || isIncomeTransaction(transaction);
    const isVisible = !isConsolidated && isConvertibleTransaction && categoryEntries.length === 1;

    if (!isVisible) {
        return null;
    }

    const transactionType = isExpenseTransaction(transaction) ? TransactionTypeEnum.EXPENSE : TransactionTypeEnum.INCOME;

    const handleConvert = () => {
        closeMenu(() => {
            const [sourceEntry] = categoryEntries;

            openConvertToTransfer({
                transactionId: transaction.id,
                transactionType,
                excludeAccountId: sourceEntry.accountId,
                sourceAmount: convertFromMicroUnits(sourceEntry.amount),
                sourceInstrumentId: sourceEntry.account.instrumentId,
                sourceCode: sourceEntry.account.instrument.code,
                skipPostConvertNavigation: true
            }).catch(emptyFn);
        });
    };

    return (
        <PopoverMenuItem
            icon={UserIconNameEnum.ArrowRightLeft}
            label={t`Convert to Transfer`}
            onPress={emptyFn}
            onPressIn={handleConvert}
            testID={TransactionListContextMenuSelector.ConvertToTransferButton}
        />
    );
};
