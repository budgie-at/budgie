import {
    TransactionWithRelationsEntityInterface,
    isNegativeAdjustmentTransaction,
    isPositiveAdjustmentTransaction
} from '@budgie/contracts';
import { Link } from 'expo-router';
import { useRef } from 'react';
import { View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { PopoverMenuAnchor } from '../../../@generic/component/popover-menu/popover-menu';
import { getTransactionHref } from '../../utils/get-transaction-href.util';
import { TransactionCardContent } from '../transaction-card-content/transaction-card-content';

import { TransactionCardSelector } from './transaction-card.selector';

export interface TransactionCardProps {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly formattedDate: string;
    readonly categoryLabel: string;
    readonly onPress?: (transaction: TransactionWithRelationsEntityInterface) => void;
    readonly onLongPress?: (transaction: TransactionWithRelationsEntityInterface, anchor: PopoverMenuAnchor) => void;
}

export const TransactionCard = ({ transaction, formattedDate, categoryLabel, onPress, onLongPress }: TransactionCardProps) => {
    const cardRef = useRef<View>(null);

    const isAdjustment = isPositiveAdjustmentTransaction(transaction) || isNegativeAdjustmentTransaction(transaction);

    const title = isNotEmptyString(transaction.title) ? transaction.title : transaction.comment;
    let cardTestID: string = TransactionCardSelector.Card(transaction.id);

    if (isAdjustment) {
        cardTestID = TransactionCardSelector.AdjustmentCard(transaction.id);
    } else if (isNotEmptyString(title)) {
        cardTestID = TransactionCardSelector.LabelCard(title);
    }

    const handlePress = () => {
        onPress?.(transaction);
    };

    const handleLongPress = () => {
        cardRef.current?.measureInWindow((x, y, width, height) => {
            onLongPress?.(transaction, { x: x + width, y, width: 0, height });
        });
    };

    const hasInteraction = isDefined(onPress) || isDefined(onLongPress);

    const interactionProps = {
        ...(isDefined(onPress) && { onPress: handlePress }),
        ...(isDefined(onLongPress) && { onLongPress: handleLongPress })
    };

    const card = (
        <Card className="p-xl gap-y-8" testID={cardTestID} {...interactionProps}>
            <TransactionCardContent transaction={transaction} formattedDate={formattedDate} categoryLabel={categoryLabel} />
        </Card>
    );

    if (hasInteraction) {
        return (
            <View ref={cardRef} collapsable={false}>
                {card}
            </View>
        );
    }

    return (
        <Link href={getTransactionHref(transaction)} asChild>
            {card}
        </Link>
    );
};
