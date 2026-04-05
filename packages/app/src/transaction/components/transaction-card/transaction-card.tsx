import {
    TransactionWithRelationsEntityInterface,
    isNegativeAdjustmentTransaction,
    isPositiveAdjustmentTransaction
} from '@budgie/contracts';
import { Link } from 'expo-router';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { TransactionCardSelectors } from '../../../@e2e/selectors/transaction-card.selector';
import { Card } from '../../../@generic/component/card/card';
import { getTransactionHref } from '../../utils/get-transaction-href.util';
import { TransactionCardContent } from '../transaction-card-content/transaction-card-content';

import type { OnEventFn } from '@rnw-community/shared';

export interface TransactionCardProps {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly formattedDate: string;
    readonly categoryLabel: string;
    readonly onPress?: OnEventFn;
    readonly onLongPress?: OnEventFn;
}

export const TransactionCard = ({ transaction, formattedDate, categoryLabel, onPress, onLongPress }: TransactionCardProps) => {
    const isAdjustment = isPositiveAdjustmentTransaction(transaction) || isNegativeAdjustmentTransaction(transaction);

    const title = isNotEmptyString(transaction.title) ? transaction.title : transaction.comment;
    let cardTestID: string = TransactionCardSelectors.Card(transaction.id);

    if (isAdjustment) {
        cardTestID = TransactionCardSelectors.AdjustmentCard(transaction.id);
    } else if (isNotEmptyString(title)) {
        cardTestID = TransactionCardSelectors.LabelCard(title);
    }

    const card = (
        <Card className="p-xl gap-y-8" testID={cardTestID} onPress={onPress} onLongPress={onLongPress}>
            <TransactionCardContent transaction={transaction} formattedDate={formattedDate} categoryLabel={categoryLabel} />
        </Card>
    );

    if (isDefined(onPress)) {
        return card;
    }

    return (
        <Link href={getTransactionHref(transaction)} asChild>
            {card}
        </Link>
    );
};
