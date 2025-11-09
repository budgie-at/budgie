import { TransactionTypeEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
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

    return (
        <BottomSheet ref={ref}>
            <View className="gap-y-1 mb-10">
                <Text className="text-center text-xl text-primary font-semibold">
                    <Trans>New Transaction</Trans>
                </Text>
                <Text className="text-center text-sm text-secondary-foreground">
                    <Trans>Choose a type to get started</Trans>
                </Text>
            </View>

            <View className="gap-y-3.5">
                <CreateTransactionCard
                    description={t`Money you spend`}
                    icon="TrendingDown"
                    title={t`Expense`}
                    type={TransactionTypeEnum.EXPENSE}
                />
                <CreateTransactionCard
                    description={t`Money you earn`}
                    icon="TrendingUp"
                    title={t`Income`}
                    type={TransactionTypeEnum.INCOME}
                />
                <CreateTransactionCard
                    description={t`Move between accounts`}
                    icon="ArrowRightLeft"
                    title={t`Transfer`}
                    type={TransactionTypeEnum.TRANSFER}
                />
                <CreateTransactionCard
                    description={t`Loans & credit cards`}
                    icon="CreditCard"
                    title={t`Debt`}
                    type={TransactionTypeEnum.DEBT}
                />
            </View>
        </BottomSheet>
    );
};
