import { TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheet } from '../../../@generic/component/bottom-sheet/bottom-sheet';
import { BottomSheetHeader } from '../../../@generic/component/bottom-sheet-header/bottom-sheet-header';
import { BottomSheetView } from '../../../@generic/component/bottom-sheet-view/bottom-sheet-view';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { TRANSACTION_ICON } from '../../constant/transaction-icon.constant';
import { TRANSACTION_TYPE } from '../../constant/transaction-type.constant';
import { CreateTransactionCard } from '../create-transaction-card/create-transaction-card';

import type { RefObject } from 'react';

interface Props {
    readonly ref: RefObject<BottomSheetInterface | null>;
}

export const CreateTransactionBottomSheet = ({ ref }: Props) => {
    const { t, i18n } = useLingui();
    const { bottom } = useSafeAreaInsets();

    const handleNavigate = (type: TransactionTypeEnum) => {
        ref.current?.close();
        void router.push(`/create-transaction/${type}`);
    };

    const style = { paddingBottom: bottom };

    return (
        <BottomSheet enableDynamicSizing ref={ref}>
            <BottomSheetView style={style}>
                <BottomSheetHeader size="md" title={t`New Transaction`} description={t`Choose a type to get started`} />

                <View className="gap-y-3.5 px-5xl">
                    <CreateTransactionCard
                        description={t`Money you spend`}
                        icon={TRANSACTION_ICON.EXPENSE}
                        title={i18n.t(TRANSACTION_TYPE.EXPENSE)}
                        onNavigate={handleNavigate}
                        type={TransactionTypeEnum.EXPENSE}
                    />
                    <CreateTransactionCard
                        description={t`Money you earn`}
                        icon={TRANSACTION_ICON.INCOME}
                        title={i18n.t(TRANSACTION_TYPE.INCOME)}
                        onNavigate={handleNavigate}
                        type={TransactionTypeEnum.INCOME}
                    />
                    <CreateTransactionCard
                        description={t`Move between accounts`}
                        icon={TRANSACTION_ICON.TRANSFER}
                        title={i18n.t(TRANSACTION_TYPE.TRANSFER)}
                        onNavigate={handleNavigate}
                        type={TransactionTypeEnum.TRANSFER}
                    />
                </View>
            </BottomSheetView>
        </BottomSheet>
    );
};
