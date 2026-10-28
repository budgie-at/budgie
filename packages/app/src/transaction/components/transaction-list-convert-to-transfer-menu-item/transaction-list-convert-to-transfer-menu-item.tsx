import { TransactionTypeEnum, UserIconNameEnum, isExpenseTransaction, isIncomeTransaction, convertFromMicroUnits } from '@budgie/contracts';
import { getTransactionCategoryEntries } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { useConvertToTransferModal } from '../../context/convert-to-transfer-modal.context';
import { useTransactionActionsMenu } from '../../context/transaction-actions-menu.context';
import { TransactionListContextMenuSelector } from '../transaction-list-context-menu/transaction-list-context-menu.selector';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionListConvertToTransferMenuItem = ({ transaction }: Props) => {
    const { t } = useLingui();
    const closeMenu = useTransactionActionsMenu();
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
            });
        });
    };

    return (
        <PopoverMenuItem
            icon={UserIconNameEnum.ArrowRightLeft}
            label={t`Convert to Transfer`}
            onPress={handleConvert}
            testID={TransactionListContextMenuSelector.ConvertToTransferButton}
        />
    );
};
