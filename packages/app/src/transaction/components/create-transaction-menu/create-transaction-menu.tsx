import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { ReceiptScannerModule } from '../../../../modules/receipt-scanner';
import { CircularActionButton } from '../../../@generic/component/circular-action-button/circular-action-button';
import { useCreateActionContext } from '../../../@generic/context/create-action.context';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
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

const CLOSE_ANIMATION_DURATION = 250;
const BUTTON_ROTATION_ACTIVE = 45;
const SPRING_CONFIG = { damping: 15, stiffness: 200, mass: 0.8 };
const CLOSE_SPRING_CONFIG = { damping: 20, stiffness: 300, mass: 0.5 };

interface Props {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly accountId?: number;
    readonly accountType?: AccountTypeEnum;
}

// eslint-disable-next-line max-lines-per-function, max-statements
export const CreateTransactionMenu = ({ isOpen, onClose, accountId, accountType }: Props) => {
    const { t } = useLingui();
    const [, hapticImpact] = useVibration();
    const { createAction } = useCreateActionContext();
    const { open: openVoiceInput } = useVoiceInputContext();
    const [isVisible, setIsVisible] = useState(false);

    const isVoiceInputEnabled = useSetting('isAiVoiceInputEnabled');
    const isAiAvailable = useAtomValue(aiSystemStatusAtom).state !== AiSystemStateEnum.DISABLED;

    const rotation = useSharedValue(0);
    const menuScale = useSharedValue(0);

    if (isOpen && !isVisible) {
        setIsVisible(true);
    }

    const handleClose = () => {
        hapticImpact(ImpactFeedbackStyle.Light);
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
            ? [{ ...createAction, testID: CreateTransactionMenuSelector.item(0), onPress: handleCreateAction }]
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
            rotation.set(withSpring(BUTTON_ROTATION_ACTIVE, SPRING_CONFIG));
            menuScale.set(withSpring(1, SPRING_CONFIG));
        } else if (isVisible) {
            rotation.set(withSpring(0, CLOSE_SPRING_CONFIG));
            menuScale.set(
                withTiming(0, { duration: CLOSE_ANIMATION_DURATION }, finished => {
                    if (finished) {
                        runOnJS(setIsVisible)(false);
                    }
                })
            );
        }
    }, [isOpen, isVisible, menuScale, rotation]);
    const buttonStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));
    const aiButtonStyle = useAnimatedStyle(() => ({
        transform: [{ scale: menuScale.value }],
        opacity: menuScale.value
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
