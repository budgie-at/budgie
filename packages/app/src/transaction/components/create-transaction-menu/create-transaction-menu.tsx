import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';

import { isDefined } from '@rnw-community/shared';

import { ReceiptScannerModule } from '../../../../modules/receipt-scanner';
import { CircularActionButton } from '../../../@generic/component/circular-action-button/circular-action-button';
import { EASE_OUT, MOTION_FAST_DURATION, SPRING_SETTLE } from '../../../@generic/constant/motion.constant';
import { useCreateActionContext } from '../../../@generic/context/create-action.context';
import { aiSystemStatusAtom } from '../../../ai/constant/ai-system-status-atom.constant';
import { useVoiceInputContext } from '../../../ai/context/voice-input.context';
import { AiSystemStateEnum } from '../../../ai/enum/ai-system-state.enum';
import { ReceiptSourceMenu } from '../../../receipt/components/receipt-source-menu/receipt-source-menu';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { CreateMenuChip } from '../create-menu-chip/create-menu-chip';
import { CreateMenuReveal } from '../create-menu-reveal/create-menu-reveal';
import { CreateMenuTile } from '../create-menu-tile/create-menu-tile';

import { CreateTransactionMenuSelector } from './create-transaction-menu.selector';

const CLOSE_ROTATION = 45;
const OPEN_SPRING = { ...SPRING_SETTLE, duration: 320 };
const FADE_TIMING = { duration: MOTION_FAST_DURATION, easing: EASE_OUT };

interface Props {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly accountId?: number;
    readonly accountType?: AccountTypeEnum;
}

// eslint-disable-next-line max-lines-per-function, max-statements
export const CreateTransactionMenu = ({ isOpen, onClose, accountId, accountType }: Props) => {
    const { t } = useLingui();
    const { createAction } = useCreateActionContext();
    const { open: openVoiceInput } = useVoiceInputContext();
    const [hasOpened, setHasOpened] = useState(false);

    const isVoiceInputEnabled = useSetting('isAiVoiceInputEnabled');
    const isAiAvailable = useAtomValue(aiSystemStatusAtom).state !== AiSystemStateEnum.DISABLED;
    const isReducedMotion = useReducedMotion();
    const progress = useSharedValue(0);

    if (isOpen && !hasOpened) {
        setHasOpened(true);
    }

    const handleCreateExpense = () => {
        onClose();
        router.push({ pathname: '/create-transaction/expense', params: { accountId } });
    };

    const handleCreateIncome = () => {
        onClose();
        router.push({ pathname: '/create-transaction/income', params: { accountId } });
    };

    const handleCreateTransfer = () => {
        onClose();
        const isDepositAccount = accountType === AccountTypeEnum.DEPOSIT;
        const transferParams = isDepositAccount ? { toAccountId: accountId } : { accountId };
        router.push({ pathname: '/create-transaction/transfer', params: transferParams });
    };

    const handleCreateRecurring = () => {
        onClose();
        router.push('/recurring/create');
    };

    const handleCreateAccount = () => {
        onClose();
        router.push('/create-account');
    };

    const handleAiPress = () => {
        onClose();
        openVoiceInput();
    };

    const handleCreateAction = () => {
        onClose();
        createAction?.onPress();
    };

    const showAiButton = isVoiceInputEnabled && isAiAvailable && !isDefined(createAction);
    const contextActionTestID = createAction?.testID ?? CreateTransactionMenuSelector.item(0);
    const pointerEvents = isOpen ? 'box-none' : 'none';
    const accessibilityVisibility = isOpen ? 'auto' : 'no-hide-descendants';

    useEffect(() => {
        if (isOpen) {
            Toast.hide();
            progress.set(isReducedMotion ? withTiming(1, FADE_TIMING) : withSpring(1, OPEN_SPRING));
        } else {
            progress.set(withTiming(0, FADE_TIMING));
        }
    }, [isOpen, isReducedMotion, progress]);

    const closeButtonStyle = useAnimatedStyle(() => {
        const value = progress.get();
        const rotation = isReducedMotion ? CLOSE_ROTATION : CLOSE_ROTATION * value;

        return { opacity: value > 0 ? 1 : 0, transform: [{ rotate: `${rotation}deg` }] };
    });

    const scrimStyle = useAnimatedStyle(() => ({ opacity: progress.get() }));

    if (!hasOpened) {
        return null;
    }

    return (
        <View
            style={StyleSheet.absoluteFill}
            pointerEvents={pointerEvents}
            accessibilityElementsHidden={!isOpen}
            importantForAccessibility={accessibilityVisibility}
        >
            <Animated.View
                className="absolute inset-x-0 bottom-0 h-[360px] bg-linear-to-b from-black/0 via-black/75 to-black/90"
                style={scrimStyle}
                pointerEvents="none"
            />

            <View className="absolute inset-x-0 bottom-0 gap-xl px-lg pb-safe" pointerEvents="box-none">
                <CreateMenuReveal progress={progress} order={3} className="flex-row gap-md">
                    <CreateMenuChip
                        icon={UserIconNameEnum.Repeat}
                        label={t`Recurring`}
                        testID={CreateTransactionMenuSelector.Recurring}
                        variant="violet"
                        onPress={handleCreateRecurring}
                    />
                    <CreateMenuChip
                        icon={UserIconNameEnum.Wallet}
                        label={t`Account`}
                        testID={CreateTransactionMenuSelector.AddAccount}
                        variant="default"
                        onPress={handleCreateAccount}
                    />
                </CreateMenuReveal>

                <CreateMenuReveal progress={progress} order={2} className="flex-row gap-xl">
                    <CreateMenuTile
                        icon={UserIconNameEnum.TrendingDown}
                        label={t`Expense`}
                        testID={CreateTransactionMenuSelector.Expense}
                        variant="destructive"
                        onPress={handleCreateExpense}
                    />
                    <CreateMenuTile
                        icon={UserIconNameEnum.TrendingUp}
                        label={t`Income`}
                        testID={CreateTransactionMenuSelector.Income}
                        variant="positive"
                        onPress={handleCreateIncome}
                    />
                </CreateMenuReveal>

                <CreateMenuReveal progress={progress} order={1} className="flex-row gap-xl">
                    <CreateMenuTile
                        icon={UserIconNameEnum.ArrowLeftRight}
                        label={t`Transfer`}
                        testID={CreateTransactionMenuSelector.Transfer}
                        variant="warning"
                        onPress={handleCreateTransfer}
                    />
                    {isDefined(ReceiptScannerModule) ? <ReceiptSourceMenu onClose={onClose} /> : null}
                </CreateMenuReveal>

                <View className="flex-row items-end gap-xl" pointerEvents="box-none">
                    <CreateMenuReveal progress={progress} order={0} className="flex-1 flex-row">
                        {isDefined(createAction) ? (
                            <CreateMenuTile
                                icon={createAction.icon}
                                label={createAction.label}
                                testID={contextActionTestID}
                                variant={createAction.variant}
                                onPress={handleCreateAction}
                            />
                        ) : null}
                        {showAiButton ? (
                            <CircularActionButton
                                icon={UserIconNameEnum.Mic}
                                label={t`Voice input`}
                                onPress={handleAiPress}
                                testID={CreateTransactionMenuSelector.AiButton}
                            />
                        ) : null}
                    </CreateMenuReveal>

                    <CircularActionButton
                        icon={UserIconNameEnum.Plus}
                        label={t`Close menu`}
                        onPress={onClose}
                        animatedStyle={closeButtonStyle}
                        testID={CreateTransactionMenuSelector.Close}
                    />
                </View>
            </View>
        </View>
    );
};
