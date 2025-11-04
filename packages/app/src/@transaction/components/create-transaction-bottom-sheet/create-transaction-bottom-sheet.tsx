import { TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { BottomSheet } from '../../../@generic/components/bottom-sheet/bottom-sheet';
import { CreateTransactionCard } from '../create-transaction-card/create-transaction-card';

import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { Ref } from 'react';

interface Props {
    readonly ref: Ref<BottomSheetModal>;
}

export const CreateTransactionBottomSheet = ({ ref }: Props) => {
    const { t } = useLingui();

    const transactionTypes = [
        {
            title: t`Expense`,
            type: TransactionTypeEnum.EXPENSE,
            icon: 'TrendingDown',
            description: t`Money you spend`
        },
        {
            title: t`Income`,
            type: TransactionTypeEnum.INCOME,
            icon: 'TrendingUp',
            description: t`Money you earn`
        },
        {
            title: t`Transfer`,
            type: TransactionTypeEnum.TRANSFER,
            icon: 'ArrowRightLeft',
            description: t`Move between accounts`
        },
        {
            title: t`Debt`,
            type: TransactionTypeEnum.DEBT,
            icon: 'CreditCard',
            description: t`Loans & credit cards`
        }
    ] as const;

    return (
        <BottomSheet ref={ref}>
            <View className="gap-y-1 mb-10">
                <Text className="text-center text-[20px] text-primary font-semibold">{t`New Transaction`}</Text>
                <Text className="text-center text-[14px] text-secondary-foreground">{t`Choose a type to get started`}</Text>
            </View>

            <View className="gap-y-3.5">
                {transactionTypes.map(({ title, description, icon, type }) => (
                    <CreateTransactionCard description={description} icon={icon} key={title} title={title} type={type} />
                ))}
            </View>
        </BottomSheet>
    );
};
