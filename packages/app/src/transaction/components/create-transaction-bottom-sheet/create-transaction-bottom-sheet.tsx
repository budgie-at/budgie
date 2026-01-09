import { TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheet } from '../../../@generic/component/bottom-sheet/bottom-sheet';
import { BottomSheetView } from '../../../@generic/component/bottom-sheet-view/bottom-sheet-view';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { useLlmContext } from '../../../ai/context/llm.context';
import { TRANSACTION_ICON } from '../../constant/transaction-icon.constant';
import { TRANSACTION_TYPE } from '../../constant/transaction-type.constant';
import { CreateTransactionCard } from '../create-transaction-card/create-transaction-card';

import type { RefObject } from 'react';

interface Props {
    readonly ref: RefObject<BottomSheetInterface | null>;
    readonly accountId?: number;
}

export const CreateTransactionBottomSheet = ({ ref, accountId }: Props) => {
    const { t } = useLingui();
    const { bottom } = useSafeAreaInsets();
    const { llm, stt } = useLlmContext();

    const isAiReady = llm.isReady && stt.isReady;

    const handleNavigate = (type: TransactionTypeEnum) => {
        ref.current?.close();
        router.push({ pathname: `/create-transaction/${type.toLowerCase() as 'income'}`, params: { accountId } });
    };

    const handleNavigateToCreateAccount = () => {
        ref.current?.close();
        router.push('/(main)/create-account');
    };

    const handleNavigateToAi = () => {
        ref.current?.close();
        router.push('/ai');
    };

    const style = { paddingBottom: bottom };

    return (
        <BottomSheet enableDynamicSizing ref={ref}>
            <BottomSheetView style={style}>
                <View className="gap-y-3.5 px-5xl pt-lg">
                    <SimpleHorizontalCell
                        description={t`Add a new bank, cash or debt account`}
                        left={<CircleIcon icon={UserIconNameEnum.Wallet} variant="secondary" size={52} iconSize={24} border={false} />}
                        onPress={handleNavigateToCreateAccount}
                        title={t`New Account`}
                        size="lg"
                    />

                    <CreateTransactionCard
                        description={t`Move between accounts`}
                        icon={TRANSACTION_ICON.TRANSFER}
                        title={t(TRANSACTION_TYPE.TRANSFER)}
                        onNavigate={handleNavigate}
                        type={TransactionTypeEnum.TRANSFER}
                    />
                    <CreateTransactionCard
                        description={t`Money you earn`}
                        icon={TRANSACTION_ICON.INCOME}
                        title={t(TRANSACTION_TYPE.INCOME)}
                        onNavigate={handleNavigate}
                        type={TransactionTypeEnum.INCOME}
                    />
                    <CreateTransactionCard
                        description={t`Money you spend`}
                        icon={TRANSACTION_ICON.EXPENSE}
                        title={t(TRANSACTION_TYPE.EXPENSE)}
                        onNavigate={handleNavigate}
                        type={TransactionTypeEnum.EXPENSE}
                    />

                    {isAiReady && (
                        <SimpleHorizontalCell
                            description={t`Create transactions using voice`}
                            left={<CircleIcon icon={UserIconNameEnum.Mic} variant="primary" size={52} iconSize={24} border={false} />}
                            onPress={handleNavigateToAi}
                            title={t`AI Assistant`}
                            size="lg"
                        />
                    )}
                </View>
            </BottomSheetView>
        </BottomSheet>
    );
};
