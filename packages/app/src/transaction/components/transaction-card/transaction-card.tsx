import {
    TransactionWithRelationsEntityInterface,
    isNegativeAdjustmentTransaction,
    isPositiveAdjustmentTransaction
} from '@budgie/contracts';
import { useRef } from 'react';
import { View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { PopoverMenuAnchor } from '../../../@generic/component/popover-menu/popover-menu';
import { TransactionListRowPositionEnum } from '../../enum/transaction-list-row-position.enum';
import { getTransactionDisplayTitle } from '../../utils/get-transaction-display-title.util';
import { TransactionCardContent } from '../transaction-card-content/transaction-card-content';
import { TransactionRowSurface } from '../transaction-row-surface/transaction-row-surface';

import { TransactionCardSelector } from './transaction-card.selector';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly position?: TransactionListRowPositionEnum;
    readonly accountId?: number | null;
    readonly onPress: (transaction: TransactionWithRelationsEntityInterface) => void;
    readonly onLongPress: (transaction: TransactionWithRelationsEntityInterface, anchor: PopoverMenuAnchor) => void;
}

export const TransactionCard = ({ transaction, position, accountId = null, onPress, onLongPress }: Props) => {
    const rowRef = useRef<View>(null);

    const isAdjustment = isPositiveAdjustmentTransaction(transaction) || isNegativeAdjustmentTransaction(transaction);

    const title = getTransactionDisplayTitle(transaction);
    let rowTestID: string = TransactionCardSelector.Card(transaction.id);

    if (isAdjustment) {
        rowTestID = TransactionCardSelector.AdjustmentCard(transaction.id);
    } else if (isNotEmptyString(title)) {
        rowTestID = TransactionCardSelector.LabelCard(title);
    }

    const handlePress = () => {
        onPress(transaction);
    };

    const handleLongPress = () => {
        rowRef.current?.measureInWindow((x, y, width, height) => {
            onLongPress(transaction, { x: x + width, y, width: 0, height });
        });
    };

    return (
        <TransactionRowSurface position={position}>
            <HapticPressable
                ref={rowRef}
                className="px-3xl py-xl active:scale-100 active:opacity-70"
                accessibilityRole="button"
                testID={rowTestID}
                collapsable={false}
                onPress={handlePress}
                onLongPress={handleLongPress}
            >
                <TransactionCardContent transaction={transaction} accountId={accountId} />
            </HapticPressable>
        </TransactionRowSurface>
    );
};
