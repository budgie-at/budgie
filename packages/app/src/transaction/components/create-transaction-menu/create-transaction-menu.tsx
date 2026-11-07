import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { scheduleOnRN } from 'react-native-worklets';

import { isDefined } from '@rnw-community/shared';

import { ReceiptScannerModule } from '../../../../modules/receipt-scanner';
import { CircularActionButton } from '../../../@generic/component/circular-action-button/circular-action-button';
import { EASE_OUT, MOTION_BASE_DURATION, MOTION_FAST_DURATION, SPRING_SETTLE } from '../../../@generic/constant/motion.constant';
import { useCreateActionContext } from '../../../@generic/context/create-action.context';
import { CreateActionInterface } from '../../../@generic/interface/create-action.interface';
import { aiSystemStatusAtom } from '../../../ai/constant/ai-system-status-atom.constant';
import { useVoiceInputContext } from '../../../ai/context/voice-input.context';
import { AiSystemStateEnum } from '../../../ai/enum/ai-system-state.enum';
import { ReceiptSourceMenu } from '../../../receipt/components/receipt-source-menu/receipt-source-menu';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { ActionItemButton } from '../action-item-button/action-item-button';
import { ActionItem } from '../action-item/action-item';
import { AiButton } from '../ai-button/ai-button';

import { CreateTransactionMenuSelector } from './create-transaction-menu.selector';

const BUTTON_ROTATION_ACTIVE = 45;
const HIDDEN_SCALE = 0.95;

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
    const [isVisible, setIsVisible] = useState(false);

    const isVoiceInputEnabled = useSetting('isAiVoiceInputEnabled');
    const isAiAvailable = useAtomValue(aiSystemStatusAtom).state !== AiSystemStateEnum.DISABLED;

    const rotation = useSharedValue(0);
    const menuScale = useSharedValue(HIDDEN_SCALE);
    const menuOpacity = useSharedValue(0);

    if (isOpen && !isVisible) {
        setIsVisible(true);
    }

    const handleClose = () => {
        onClose();
    };

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

    const leadingItems: CreateActionInterface[] = [
        ...(isDefined(createAction)
            ? [{ testID: CreateTransactionMenuSelector.item(0), ...createAction, onPress: handleCreateAction }]
            : []),
        {
            icon: UserIconNameEnum.TrendingDown,
            label: t`Expense`,
            testID: CreateTransactionMenuSelector.Expense,
            variant: 'destructive',
            onPress: handleCreateExpense
        }
    ];

    const trailingItems: CreateActionInterface[] = [
        {
            icon: UserIconNameEnum.TrendingUp,
            label: t`Income`,
            testID: CreateTransactionMenuSelector.Income,
            variant: 'positive',
            onPress: handleCreateIncome
        },
        {
            icon: UserIconNameEnum.ArrowLeftRight,
            label: t`Transfer`,
            testID: CreateTransactionMenuSelector.Transfer,
            variant: 'warning',
            onPress: handleCreateTransfer
        },
        {
            icon: UserIconNameEnum.Repeat,
            label: t`Recurring`,
            testID: CreateTransactionMenuSelector.Recurring,
            variant: 'violet',
            onPress: handleCreateRecurring
        },
        {
            icon: UserIconNameEnum.Wallet,
            label: t`Account`,
            testID: CreateTransactionMenuSelector.AddAccount,
            variant: 'secondary',
            onPress: handleCreateAccount
        }
    ];

    const actionRows = [
        ...leadingItems.map(item => <ActionItemButton key={item.label} {...item} />),
        ...(isDefined(ReceiptScannerModule) ? [<ReceiptSourceMenu key="receipt-source" onClose={onClose} />] : []),
        ...trailingItems.map(item => <ActionItemButton key={item.label} {...item} />)
    ];

    useEffect(() => {
        if (isOpen) {
            Toast.hide();
            rotation.set(withSpring(BUTTON_ROTATION_ACTIVE, SPRING_SETTLE));
            menuScale.set(withSpring(1, SPRING_SETTLE));
            menuOpacity.set(withTiming(1, { duration: MOTION_BASE_DURATION, easing: EASE_OUT }));
        } else if (isVisible) {
            rotation.set(withSpring(0, SPRING_SETTLE));
            menuScale.set(withTiming(HIDDEN_SCALE, { duration: MOTION_FAST_DURATION, easing: EASE_OUT }));
            menuOpacity.set(
                withTiming(0, { duration: MOTION_FAST_DURATION, easing: EASE_OUT }, finished => {
                    if (finished) {
                        scheduleOnRN(setIsVisible, false);
                    }
                })
            );
        }
    }, [isOpen, isVisible, menuOpacity, menuScale, rotation]);
    const buttonStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.get()}deg` }] }));
    const aiButtonStyle = useAnimatedStyle(() => ({
        transform: [{ scale: menuScale.get() }],
        opacity: menuOpacity.get()
    }));

    if (!isVisible) {
        return null;
    }

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {showAiButton && (
                <Animated.View className="absolute inset-x-0 bottom-0 items-center pb-safe" style={aiButtonStyle} pointerEvents="box-none">
                    <AiButton onPress={handleAiPress} testID={CreateTransactionMenuSelector.AiButton} />
                </Animated.View>
            )}

            <View className="absolute inset-x-0 bottom-0 items-end px-lg pb-safe" pointerEvents="box-none">
                <View className="self-stretch items-end" pointerEvents="box-none">
                    {actionRows.map((row, index) => (
                        <ActionItem key={row.key} index={index} totalItems={actionRows.length} isOpen={isOpen}>
                            {row}
                        </ActionItem>
                    ))}

                    <CircularActionButton
                        icon={UserIconNameEnum.Plus}
                        onPress={handleClose}
                        animatedStyle={buttonStyle}
                        testID={CreateTransactionMenuSelector.Close}
                    />
                </View>
            </View>
        </View>
    );
};
