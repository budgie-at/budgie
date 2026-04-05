import {
    TransactionTypeEnum,
    TransactionWithRelationsEntityInterface,
    UserIconNameEnum,
    isExpenseTransaction,
    isIncomeTransaction
} from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ImpactFeedbackStyle } from 'expo-haptics/src/Haptics.types';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { View } from 'react-native';

import { emptyFn } from '@rnw-community/shared';

import { TransactionContextMenuSelectors } from '../../../@e2e/selectors/transaction-context-menu.selector';
import { PopoverMenu, PopoverMenuAnchor } from '../../../@generic/component/popover-menu/popover-menu';
import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { useDeferredMenuClose } from '../../../@generic/hook/use-deferred-menu-close.hook';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useConvertToTransferModal } from '../../context/convert-to-transfer-modal.context';
import { useDeleteTransaction } from '../../hook/use-delete-transaction.hook';
import { getTransactionHref } from '../../utils/get-transaction-href.util';
import { TransactionCard } from '../transaction-card/transaction-card';

import type { TransactionCardProps } from '../transaction-card/transaction-card';

type TransactionContextMenuCardProps = Omit<TransactionCardProps, 'onPress' | 'onLongPress'>;

const isConvertibleTransaction = (transaction: TransactionWithRelationsEntityInterface): boolean =>
    isExpenseTransaction(transaction) || isIncomeTransaction(transaction);

const getConvertTransactionType = (
    transaction: TransactionWithRelationsEntityInterface
): TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME =>
    isExpenseTransaction(transaction) ? TransactionTypeEnum.EXPENSE : TransactionTypeEnum.INCOME;

export const TransactionContextMenuCard = ({ transaction, formattedDate, categoryLabel }: TransactionContextMenuCardProps) => {
    const { t } = useLingui();
    const router = useRouter();
    const deleteTransaction = useDeleteTransaction();
    const [openConvertToTransfer] = useConvertToTransferModal();
    const [, hapticImpact] = useVibration();
    const cardRef = useRef<View>(null);
    const { isMenuOpen, closeMenu, handleCloseComplete, openMenu } = useDeferredMenuClose();

    const [anchor, setAnchor] = useState<PopoverMenuAnchor | undefined>();

    const canConvert = isConvertibleTransaction(transaction);

    const handlePress = () => {
        router.push(getTransactionHref(transaction));
    };

    const handleLongPress = () => {
        hapticImpact(ImpactFeedbackStyle.Medium);
        cardRef.current?.measureInWindow((x, y, width, height) => {
            setAnchor({ x: x + width, y, width: 0, height });
            openMenu();
        });
    };

    const handleEditPress = () => {
        closeMenu(() => void router.push(getTransactionHref(transaction)));
    };

    const handleDeletePress = () => {
        closeMenu(() => {
            deleteTransaction(transaction.id).catch(emptyFn);
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
        <View ref={cardRef} collapsable={false}>
            <TransactionCard
                transaction={transaction}
                formattedDate={formattedDate}
                categoryLabel={categoryLabel}
                onPress={handlePress}
                onLongPress={handleLongPress}
            />
            <PopoverMenu isOpen={isMenuOpen} onClose={closeMenu} onCloseComplete={handleCloseComplete} anchor={anchor}>
                <View className="py-sm">
                    <PopoverMenuItem
                        icon={UserIconNameEnum.Pencil}
                        label={t`Edit Transaction`}
                        onPress={handleEditPress}
                        testID={TransactionContextMenuSelectors.EditButton}
                    />
                    {canConvert ? (
                        <PopoverMenuItem
                            icon={UserIconNameEnum.ArrowRightLeft}
                            label={t`Convert to Transfer`}
                            onPress={handleConvertPress}
                            testID={TransactionContextMenuSelectors.ConvertToTransferButton}
                        />
                    ) : null}
                    <PopoverMenuItem
                        icon={UserIconNameEnum.Trash2}
                        label={t`Delete Transaction`}
                        onPress={handleDeletePress}
                        variant="destructive"
                        testID={TransactionContextMenuSelectors.DeleteButton}
                    />
                </View>
            </PopoverMenu>
        </View>
    );
};
