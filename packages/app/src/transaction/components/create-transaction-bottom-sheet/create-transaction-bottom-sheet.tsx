import { TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { View } from 'react-native';

import { BottomSheet } from '../../../@generic/components/bottom-sheet/bottom-sheet';
import { BottomSheetHeader } from '../../../@generic/components/bottom-sheet-header/bottom-sheet-header';
import { BottomSheetView } from '../../../@generic/components/bottom-sheet-view/bottom-sheet-view';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { CreateTransactionCard } from '../create-transaction-card/create-transaction-card';

import type { RefObject } from 'react';

interface Props {
    readonly ref: RefObject<BottomSheetInterface | null>;
}

export const CreateTransactionBottomSheet = ({ ref }: Props) => {
    const { t } = useLingui();

    const handleNavigate = (type: TransactionTypeEnum) => {
        ref.current?.close();
        void router.push(`/create-transaction/${type}`);
    }

    return (
        <BottomSheet ref={ref}>
            <BottomSheetView>
                <BottomSheetHeader size="md" title={t`New Transaction`} description={t`Choose a type to get started`} />

                <View className="gap-y-3.5 px-5xl">
                    <CreateTransactionCard
                        description={t`Money you spend`}
                        icon="TrendingDown"
                        title={t`Expense`}
                        onNavigate={handleNavigate}
                        type={TransactionTypeEnum.EXPENSE}
                    />
                    <CreateTransactionCard
                        description={t`Money you earn`}
                        icon="TrendingUp"
                        title={t`Income`}
                        onNavigate={handleNavigate}
                        type={TransactionTypeEnum.INCOME}
                    />
                    <CreateTransactionCard
                        description={t`Move between accounts`}
                        icon="ArrowRightLeft"
                        title={t`Transfer`}
                        onNavigate={handleNavigate}
                        type={TransactionTypeEnum.TRANSFER}
                    />
                    <CreateTransactionCard
                        description={t`Loans & credit cards`}
                        icon="CreditCard"
                        title={t`Debt`}
                        onNavigate={handleNavigate}
                        type={TransactionTypeEnum.DEBT}
                    />
                </View>
            </BottomSheetView>
        </BottomSheet>
    );
};
