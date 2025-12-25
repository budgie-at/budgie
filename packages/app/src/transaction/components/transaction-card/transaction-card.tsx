import { TransactionTypeEnum, TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import { Link } from 'expo-router';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { Card } from '../../../@generic/components/card/card';
import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { TRANSACTION_COLOR } from '../../constant/transaction-color.constant';
import { getTransactionIcon } from '../../utils/get-transaction-icon.util';
import { getTransactionType } from '../../utils/get-transaction-type.util';
import { TransactionCardAccountInfo } from '../transaction-card-account-info/transaction-card-account-info';
import { TransactionCategoryBadge } from '../transaction-category-badge/transaction-category-badge';
import { TransactionAmount } from '../transaction-amount/transaction-amount';

export interface TransactionCardPureProps {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly formattedDate: string;
    readonly categoryLabel: string;
}

export const TransactionCard = ({ transaction, formattedDate, categoryLabel }: TransactionCardPureProps) => {
    const categoryIcon = getTransactionIcon(transaction);
    const type = getTransactionType(transaction);

    const title = isNotEmptyString(transaction.title) ? transaction.title : transaction.comment;
    const comment = isNotEmptyString(transaction.title) ? transaction.comment : null;

    return (
        <Link href={`/transactions/${transaction.id}`} asChild>
            <Card className="p-xl gap-y-[32px]">
                <View className="flex-row gap-x-xl">
                    <CircleIcon size="md" icon={ICONS[categoryIcon]} variant={TRANSACTION_COLOR[type]} />

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

                        {transaction.type === TransactionTypeEnum.TRANSFER ? null : (
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
