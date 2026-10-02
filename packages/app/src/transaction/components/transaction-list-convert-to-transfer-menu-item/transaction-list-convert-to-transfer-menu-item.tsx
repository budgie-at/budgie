import { TransactionTypeEnum, UserIconNameEnum, isExpenseTransaction, isIncomeTransaction } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { emptyFn } from '@rnw-community/shared';

import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { useTransactionListConvertToTransferBase } from '../../hook/use-transaction-list-convert-to-transfer-base.hook';
import { buildConvertToTransferParams } from '../../utils/build-convert-to-transfer-params.util';
import { TransactionListContextMenuSelector } from '../transaction-list-context-menu/transaction-list-context-menu.selector';

export const TransactionListConvertToTransferMenuItem = () => {
    const { t } = useLingui();
    const { transaction, closeMenu, openConvertToTransfer, isConsolidated, categoryEntries } = useTransactionListConvertToTransferBase();

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
                ...buildConvertToTransferParams(transaction.id, transactionType, sourceEntry),
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
