import { TransactionTypeEnum, TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import { Link } from 'expo-router';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { TRANSACTION_COLOR } from '../../constant/transaction-color.constant';
import { getTransactionIcon } from '../../utils/get-transaction-icon.util';
import { getTransactionType } from '../../utils/get-transaction-type.util';
import { TransactionAmount } from '../transaction-amount/transaction-amount';
import { TransactionCardAccountInfo } from '../transaction-card-account-info/transaction-card-account-info';
import { TransactionCategoryBadge } from '../transaction-category-badge/transaction-category-badge';

export interface TransactionCardProps {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly formattedDate: string;
    readonly categoryLabel: string;
}

export const TransactionCard = ({ transaction, formattedDate, categoryLabel }: TransactionCardProps) => {
    const categoryIcon = getTransactionIcon(transaction);
    const type = getTransactionType(transaction);

    const title = isNotEmptyString(transaction.title) ? transaction.title : transaction.comment;
    const comment = isNotEmptyString(transaction.title) ? transaction.comment : null;

    return (
        <Link href={`/transactions/${transaction.id}`} asChild>
            <Card className="p-xl gap-y-8">
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

                <View className="flex-row justify-between items-center">
                    <TransactionCardAccountInfo transaction={transaction} />

                    <Text className="text-xs text-secondary-foreground">{formattedDate}</Text>
                </View>
            </Card>
        </Link>
    );
};
