import { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { router } from 'expo-router';
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

const amountVariants = cva('text-md', {
    variants: {
        type: FOREGROUND_COLOR_PALETTE
    }
});

export const TransactionCardPure = ({ transaction, formattedAmount, formattedDate, categoryLabel }: TransactionCardPureProps) => {
    const categoryIcon = getTransactionIcon(transaction);
    const transactionType = getTransactionType(transaction);

    const handleNavigate = () => void router.push(`/transactions/${transaction.id}`);

    return (
        <Card onPress={handleNavigate} className="flex-row items-center gap-x-xl p-xl relative">
            <CircleIcon size="md" icon={ICONS[categoryIcon]} variant={TRANSACTION_COLOR[transactionType]} />

            <View className="flex-1 gap-y-xxs">
                {isNotEmptyString(transaction.title) ? <Text className="text-primary text-sm">{transaction.title}</Text> : null}

                <View className="gap-y-md">
                    <View className="flex-row items-center gap-x-sm ">
                        {isNotEmptyString(transaction.comment) ? <Text className="text-primary text-sm">{transaction.comment}</Text> : null}
                        <TransactionCardAccountInfo transaction={transaction} />
                    </View>

                    <TransactionCategoryBadgePure transaction={transaction} categoryLabel={categoryLabel} />
                </View>
            </View>

            <Text className={amountVariants({ type: TRANSACTION_COLOR[transactionType] })}>{formattedAmount}</Text>
            <Text className="text-xxs text-secondary-foreground absolute right-[12px] bottom-[8px]">{formattedDate}</Text>
        </Card>
    );
};
