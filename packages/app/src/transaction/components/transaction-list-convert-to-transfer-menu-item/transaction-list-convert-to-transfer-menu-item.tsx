import { TransactionTypeEnum, UserIconNameEnum, isExpenseTransaction, isIncomeTransaction, convertFromMicroUnits } from '@budgie/contracts';
import { getTransactionCategoryEntries } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { ActionsMenuItem } from '../../../@generic/component/actions-menu-item/actions-menu-item';
import { useConvertToTransferModal } from '../../context/convert-to-transfer-modal.context';
import { TransactionListContextMenuSelector } from '../transaction-list-context-menu/transaction-list-context-menu.selector';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionListConvertToTransferMenuItem = ({ transaction }: Props) => {
    const { t } = useLingui();
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
    };

    return (
        <ActionsMenuItem
            icon={UserIconNameEnum.ArrowRightLeft}
            label={t`Convert to Transfer`}
            onPress={handleConvert}
            testID={TransactionListContextMenuSelector.ConvertToTransferButton}
        />
    );
};
