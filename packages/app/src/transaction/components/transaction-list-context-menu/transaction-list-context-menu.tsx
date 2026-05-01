import { TransactionTypeEnum, UserIconNameEnum, isExpenseTransaction, isIncomeTransaction } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { useRef } from 'react';
import { View } from 'react-native';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { PopoverMenu } from '../../../@generic/component/popover-menu/popover-menu';
import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useConvertToTransferModal } from '../../context/convert-to-transfer-modal.context';
import { useDeleteTransaction } from '../../hook/use-delete-transaction.hook';
import { getTransactionHref } from '../../utils/get-transaction-href.util';
import { TransactionListConvertMenuItem } from '../transaction-list-convert-menu-item/transaction-list-convert-menu-item';

import { TransactionListContextMenuSelector } from './transaction-list-context-menu.selector';

import type { TransactionListContextMenuPropsInterface } from '../../interface/transaction-list-context-menu-props.interface';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import type { EmptyFn } from '@rnw-community/shared';

const isConvertibleTransaction = (transaction: TransactionWithRelationsEntityInterface): boolean =>
    isExpenseTransaction(transaction) || isIncomeTransaction(transaction);

const getConvertTransactionType = (
    transaction: TransactionWithRelationsEntityInterface
): TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME =>
    isExpenseTransaction(transaction) ? TransactionTypeEnum.EXPENSE : TransactionTypeEnum.INCOME;

// eslint-disable-next-line max-statements -- Context menu component with deferred action pattern and multiple handlers
export const TransactionListContextMenu = ({
    transaction,
    anchor,
    isOpen,
    onClose,
    onCloseComplete
}: TransactionListContextMenuPropsInterface) => {
    const { t } = useLingui();
    const router = useRouter();
    const deleteTransaction = useDeleteTransaction();
    const [openConvertToTransfer] = useConvertToTransferModal();
    const pendingActionRef = useRef<EmptyFn | null>(null);

    if (!isDefined(transaction)) {
        return null;
    }

    const isConsolidated = isDefined(transaction.consolidationType);
    const canConvert = !isConsolidated && isConvertibleTransaction(transaction);
    const deleteLabel = isConsolidated ? t`Unconsolidate Transaction` : t`Delete Transaction`;
    const deleteIcon = isConsolidated ? UserIconNameEnum.GitPullRequestClosed : UserIconNameEnum.Trash2;

    const closeMenu = (afterClose?: EmptyFn) => {
        pendingActionRef.current = afterClose ?? null;
        onClose();
    };

    const handleDismiss = () => {
        pendingActionRef.current = null;
        onClose();
    };

    const handleCloseComplete = () => {
        if (isDefined(pendingActionRef.current)) {
            pendingActionRef.current();
            pendingActionRef.current = null;
        }

        onCloseComplete();
    };

    const handleEditPress = () => {
        closeMenu(() => void router.push(getTransactionHref(transaction)));
    };

    const handleDeletePress = () => {
        closeMenu(() => {
            deleteTransaction(transaction.id, { isConsolidated }).catch(emptyFn);
        });
    };

    const handleConvertPress = () => {
        const [sourceEntry] = transaction.entries;
        const sourceAccount = sourceEntry.account;

        closeMenu(() => {
            openConvertToTransfer({
                transactionId: transaction.id,
                transactionType: getConvertTransactionType(transaction),
                excludeAccountId: sourceEntry.accountId,
                sourceAmount: convertFromMicroUnits(sourceEntry.amount),
                sourceInstrumentId: sourceAccount.instrumentId,
                sourceCode: sourceAccount.instrument.code,
                skipPostConvertNavigation: true
            }).catch(emptyFn);
        });
    };

    return (
        <PopoverMenu isOpen={isOpen} onClose={handleDismiss} onCloseComplete={handleCloseComplete} anchor={anchor}>
            <View className="py-sm">
                <PopoverMenuItem
                    icon={UserIconNameEnum.Pencil}
                    label={t`Edit Transaction`}
                    onPress={handleEditPress}
                    testID={TransactionListContextMenuSelector.EditButton}
                />
                <TransactionListConvertMenuItem isVisible={canConvert} onConvert={handleConvertPress} />
                <PopoverMenuItem
                    icon={deleteIcon}
                    label={deleteLabel}
                    onPress={handleDeletePress}
                    variant="destructive"
                    testID={TransactionListContextMenuSelector.DeleteButton}
                />
            </View>
        </PopoverMenu>
    );
};
