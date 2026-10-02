import { TransactionTypeEnum, UserIconNameEnum, isExpenseTransaction } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { emptyFn } from '@rnw-community/shared';

import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { useTransactionListConvertToTransferBase } from '../../hook/use-transaction-list-convert-to-transfer-base.hook';
import { buildConvertToTransferParams } from '../../utils/build-convert-to-transfer-params.util';
import { TransactionListContextMenuSelector } from '../transaction-list-context-menu/transaction-list-context-menu.selector';

export const TransactionListStartDepositMenuItem = () => {
    const { t } = useLingui();
    const { transaction, closeMenu, openConvertToTransfer, isConsolidated, categoryEntries } = useTransactionListConvertToTransferBase();

    const isVisible = !isConsolidated && isExpenseTransaction(transaction) && categoryEntries.length === 1;

    if (!isVisible) {
        return null;
    }

    const handleStartDeposit = () => {
        closeMenu(() => {
            const [sourceEntry] = categoryEntries;

            openConvertToTransfer({
                ...buildConvertToTransferParams(transaction.id, TransactionTypeEnum.EXPENSE, sourceEntry),
                skipPostConvertNavigation: true,
                startDeposit: true
            }).catch(emptyFn);
        });
    };

    return (
        <PopoverMenuItem
            icon={UserIconNameEnum.Landmark}
            label={t`Start Deposit`}
            onPress={emptyFn}
            onPressIn={handleStartDeposit}
            testID={TransactionListContextMenuSelector.StartDepositButton}
        />
    );
};
