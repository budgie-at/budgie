import { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Link } from 'expo-router';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { Card } from '../../../@generic/components/card/card';
import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { TRANSACTION_COLOR } from '../../constant/transaction-color.constant';
import { getTransactionIcon } from '../../utils/get-transaction-icon.util';
import { getTransactionType } from '../../utils/get-transaction-type.util';
import { TransactionCardAccountInfo } from '../transaction-card-account-info/transaction-card-account-info';
import { TransactionCategoryBadgePure } from '../transaction-category-badge/transaction-category-badge';

export interface TransactionCardPureProps {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly formattedAmount: string;
    readonly formattedDate: string;
    readonly categoryLabel: string;
}

const amountVariants = cva('text-sm font-semibold', {
    variants: { type: FOREGROUND_COLOR_PALETTE }
});

export const TransactionCard = ({ transaction, formattedAmount, formattedDate, categoryLabel }: TransactionCardPureProps) => {
    const categoryIcon = getTransactionIcon(transaction);
    const type = getTransactionType(transaction);

    return (
        <Link href={`/transactions/${transaction.id}`} asChild>
            <Card className="p-xl gap-y-[32px]">
                <View className="flex-row gap-x-xl">
                    <CircleIcon size="md" icon={ICONS[categoryIcon]} variant={TRANSACTION_COLOR[type]} />

                    <View className="flex-1 gap-y-xs pt-xxs">
                        {isNotEmptyString(transaction.title) ? (
                            <Text className="text-primary text-sm font-semibold" numberOfLines={2} ellipsizeMode="tail">
                                {transaction.title}
                            </Text>
                        ) : null}
                        {isNotEmptyString(transaction.comment) ? (
                            <Text className="text-secondary-foreground text-xs" numberOfLines={2} ellipsizeMode="tail">
                                {transaction.comment}
                            </Text>
                        ) : null}

                        <TransactionCategoryBadgePure transaction={transaction} categoryLabel={categoryLabel} />
                    </View>

                    <Text className={amountVariants({ type: TRANSACTION_COLOR[type] })}>{formattedAmount}</Text>
                </View>

                <View className="flex-row justify-between items-center">
                    <TransactionCardAccountInfo transaction={transaction} />

                    <Text className="text-xs text-secondary-foreground">{formattedDate}</Text>
                </View>
            </Card>
        </Link>
    );
};
