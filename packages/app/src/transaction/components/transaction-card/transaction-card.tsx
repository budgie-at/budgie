import {
    TransactionTypeEnum,
    TransactionWithRelationsEntityInterface,
    isNegativeAdjustmentTransaction,
    isPositiveAdjustmentTransaction
} from '@budgie/contracts';
import { Link } from 'expo-router';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { TransactionCardSelectors } from '../../../@e2e/selectors/transaction-card.selector';
import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { TRANSACTION_COLOR } from '../../constant/transaction-color.constant';
import { getTransactionHref } from '../../utils/get-transaction-href.util';
import { getTransactionIcon } from '../../utils/get-transaction-icon.util';
import { getTransactionType } from '../../utils/get-transaction-type.util';
import { TransactionAmount } from '../transaction-amount/transaction-amount';
import { TransactionCardAccountInfo } from '../transaction-card-account-info/transaction-card-account-info';
import { TransactionCardTag } from '../transaction-card-tag/transaction-card-tag';
import { TransactionCategoryBadge } from '../transaction-category-badge/transaction-category-badge';

import type { OnEventFn } from '@rnw-community/shared';

export interface TransactionCardProps {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly formattedDate: string;
    readonly categoryLabel: string;
    readonly onPress?: OnEventFn;
    readonly onLongPress?: OnEventFn;
}

export const TransactionCard = ({ transaction, formattedDate, categoryLabel, onPress, onLongPress }: TransactionCardProps) => {
    const categoryIcon = getTransactionIcon(transaction);
    const type = getTransactionType(transaction);
    const isAdjustment = isPositiveAdjustmentTransaction(transaction) || isNegativeAdjustmentTransaction(transaction);

    const title = isNotEmptyString(transaction.title) ? transaction.title : transaction.comment;
    const comment = isNotEmptyString(transaction.title) ? transaction.comment : null;
    let cardTestID: string = TransactionCardSelectors.Card(transaction.id);

    if (isAdjustment) {
        cardTestID = TransactionCardSelectors.AdjustmentCard(transaction.id);
    } else if (isNotEmptyString(title)) {
        cardTestID = TransactionCardSelectors.LabelCard(title);
    }

    const cardContent = (
        <Card className="p-xl gap-y-8" testID={cardTestID} onPress={onPress} onLongPress={onLongPress}>
            <View className="flex-row gap-x-xl">
                <CircleIcon size={32} iconSize={16} icon={categoryIcon} variant={TRANSACTION_COLOR[type]} />

                <View className="flex-1 gap-y-xs pt-xxs">
                    {isNotEmptyString(title) ? (
                        <Text className="text-primary text-sm font-semibold" numberOfLines={2} ellipsizeMode="tail">
                            {title}
                        </Text>
                    ) : null}

                    {isNotEmptyString(comment) ? (
                        <Text className="text-secondary-foreground text-xs" numberOfLines={2} ellipsizeMode="tail">
                            {comment}
                        </Text>
                    ) : null}

                    {transaction.type === TransactionTypeEnum.TRANSFER || transaction.type === TransactionTypeEnum.DEBT ? null : (
                        <TransactionCategoryBadge transaction={transaction} categoryLabel={categoryLabel} />
                    )}
                </View>

                <TransactionAmount transaction={transaction} />
            </View>

            <View className="flex-row justify-between items-end flex-1 gap-x-lg">
                <TransactionCardAccountInfo transaction={transaction} />

                <View className="items-end gap-y-xs">
                    <TransactionCardTag transaction={transaction} />
                    <Text className="text-xs text-secondary-foreground">{formattedDate}</Text>
                </View>
            </View>
        </Card>
    );

    if (isDefined(onPress)) {
        return cardContent;
    }

    return (
        <Link href={getTransactionHref(transaction)} asChild>
            {cardContent}
        </Link>
    );
};
