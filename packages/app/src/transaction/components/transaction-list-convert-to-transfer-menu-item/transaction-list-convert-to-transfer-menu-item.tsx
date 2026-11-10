import {
    TransactionTypeEnum,
    UserIconNameEnum,
    isExpenseTransaction,
    isIncomeTransaction,
    convertFromMicroUnits,
    type TransactionWithRelationsEntityInterface
} from '@budgie/contracts';
import { getTransactionCategoryEntries } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { ActionsMenuItem } from '../../../@generic/component/actions-menu-item/actions-menu-item';
import { useOpenModal } from '../../../@generic/hook/use-open-modal/use-open-modal.hook';
import { TransactionListContextMenuSelector } from '../transaction-list-context-menu/transaction-list-context-menu.selector';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionListConvertToTransferMenuItem = ({ transaction }: Props) => {
    const { t } = useLingui();
    const openConvertToTransfer = useOpenModal('/convert-to-transfer');

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
