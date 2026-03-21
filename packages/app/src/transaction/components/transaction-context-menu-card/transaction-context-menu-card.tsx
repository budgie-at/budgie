import {
    TransactionTypeEnum,
    TransactionWithRelationsEntityInterface,
    UserIconNameEnum,
    isExpenseTransaction,
    isIncomeTransaction
} from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { PopoverMenu, PopoverMenuAnchor } from '../../../@generic/component/popover-menu/popover-menu';
import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useConvertToTransferModal } from '../../context/convert-to-transfer-modal.context';
import { useDeleteTransaction } from '../../hook/use-delete-transaction.hook';
import { TransactionCard } from '../transaction-card/transaction-card';

import type { TransactionCardProps } from '../transaction-card/transaction-card';

interface DeferredAction {
    readonly execute: () => void;
}

const isConvertibleTransaction = (transaction: TransactionWithRelationsEntityInterface): boolean =>
    isExpenseTransaction(transaction) || isIncomeTransaction(transaction);

const getConvertTransactionType = (
    transaction: TransactionWithRelationsEntityInterface
): TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME =>
    isExpenseTransaction(transaction) ? TransactionTypeEnum.EXPENSE : TransactionTypeEnum.INCOME;

export const TransactionContextMenuCard = ({ transaction, formattedDate, categoryLabel }: TransactionCardProps) => {
    const { t } = useLingui();
    const deleteTransaction = useDeleteTransaction();
    const [openConvertToTransfer] = useConvertToTransferModal();
    const cardRef = useRef<View>(null);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [anchor, setAnchor] = useState<PopoverMenuAnchor | undefined>();
    const [deferredAction, setDeferredAction] = useState<DeferredAction | null>(null);

    const canConvert = isConvertibleTransaction(transaction);

    const handleLongPress = () => {
        cardRef.current?.measureInWindow((x, y, width, height) => {
            setAnchor({ x: x + width, y, width: 0, height });
            setIsMenuOpen(true);
        });
    };

    const handleCloseMenu = (afterClose?: () => void) => {
        setDeferredAction(isDefined(afterClose) ? { execute: afterClose } : null);
        setIsMenuOpen(false);
    };

    const handleCloseComplete = () => {
        if (isDefined(deferredAction)) {
            deferredAction.execute();
            setDeferredAction(null);
        }
    };

    const handleDeletePress = () => {
        handleCloseMenu(() => void deleteTransaction(transaction.id));
    };

    const handleConvertPress = () => {
        const [sourceEntry] = transaction.entries;
        const sourceAccount = sourceEntry.account;

        handleCloseMenu(
            () =>
                void openConvertToTransfer({
                    transactionId: transaction.id,
                    transactionType: getConvertTransactionType(transaction),
                    excludeAccountId: sourceEntry.accountId,
                    sourceAmount: convertFromMicroUnits(sourceEntry.amount),
                    sourceInstrumentId: sourceAccount.instrumentId,
                    sourceCode: sourceAccount.instrument.code,
                    returnToList: true
                })
        );
    };

    return (
        <View ref={cardRef} collapsable={false}>
            <TransactionCard
                transaction={transaction}
                formattedDate={formattedDate}
                categoryLabel={categoryLabel}
                onLongPress={handleLongPress}
            />
            <PopoverMenu isOpen={isMenuOpen} onClose={handleCloseMenu} onCloseComplete={handleCloseComplete} anchor={anchor}>
                <View className="py-sm">
                    {canConvert ? (
                        <PopoverMenuItem
                            icon={UserIconNameEnum.ArrowRightLeft}
                            label={t`Convert to Transfer`}
                            onPress={handleConvertPress}
                        />
                    ) : null}
                    <PopoverMenuItem
                        icon={UserIconNameEnum.Trash2}
                        label={t`Delete Transaction`}
                        onPress={handleDeletePress}
                        variant="destructive"
                    />
                </View>
            </PopoverMenu>
        </View>
    );
};
