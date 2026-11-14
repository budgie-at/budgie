import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { useDeferredValue, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
    Easing,
    ReduceMotion,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { scheduleOnRN } from 'react-native-worklets';

import { isDefined } from '@rnw-community/shared';

import { ReceiptScannerModule } from '../../../../modules/receipt-scanner';
import { CircularActionButton } from '../../../@generic/component/circular-action-button/circular-action-button';
import { EASE_OUT, MOTION_FAST_DURATION, SPRING_SETTLE } from '../../../@generic/constant/motion.constant';
import { splashScreenHiddenAtom } from '../../../@generic/constant/splash-screen-hidden-atom.constant';
import { useCreateActionContext } from '../../../@generic/context/create-action.context';
import { aiSystemStatusAtom } from '../../../ai/constant/ai-system-status-atom.constant';
import { useVoiceInputContext } from '../../../ai/context/voice-input.context';
import { AiSystemStateEnum } from '../../../ai/enum/ai-system-state.enum';
import { ReceiptSourceMenu } from '../../../receipt/components/receipt-source-menu/receipt-source-menu';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { CREATE_MENU_LARGE_TEXT_FONT_SCALE } from '../../constant/create-menu-large-text-font-scale.constant';
import { CreateMenuChip } from '../create-menu-chip/create-menu-chip';
import { CreateMenuReveal } from '../create-menu-reveal/create-menu-reveal';
import { CreateMenuTile } from '../create-menu-tile/create-menu-tile';

import { CreateTransactionMenuSelector } from './create-transaction-menu.selector';

import type { RefObject } from 'react';

const CLOSE_ROTATION = 45;
const OPEN_SPRING = { ...SPRING_SETTLE, duration: 320 };
const FADE_TIMING = { duration: MOTION_FAST_DURATION, easing: EASE_OUT };
const REDUCED_MOTION_FADE_TIMING = { duration: MOTION_FAST_DURATION, easing: Easing.out(Easing.quad), reduceMotion: ReduceMotion.Never };
const STACK_GAP_CLASSNAME = 'gap-xl';
const LARGE_TEXT_STACK_GAP_CLASSNAME = 'gap-lg';

interface Props {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly triggerRef: RefObject<View | null>;
    readonly accountId?: number;
    readonly accountType?: AccountTypeEnum;
}

// eslint-disable-next-line max-lines-per-function, max-statements
export const CreateTransactionMenu = ({ isOpen, onClose, triggerRef, accountId, accountType }: Props) => {
    const { t } = useLingui();
    const { createAction } = useCreateActionContext();
    const { open: openVoiceInput } = useVoiceInputContext();
    const { fontScale } = useWindowDimensions();
    const firstTileRef = useRef<View>(null);
    const shouldRestoreFocusRef = useRef(false);
    const isOpenRef = useRef(isOpen);
    const [isPresented, setIsPresented] = useState(isOpen);

    const isVoiceInputEnabled = useSetting('isAiVoiceInputEnabled');
    const isAiAvailable = useAtomValue(aiSystemStatusAtom).state !== AiSystemStateEnum.DISABLED;
    const isReducedMotion = useReducedMotion();
    const progress = useSharedValue(0);
    const isSplashScreenHidden = useAtomValue(splashScreenHiddenAtom);
    const isMounted = useDeferredValue(isSplashScreenHidden, false) || isPresented;

    if (isOpen && !isPresented) {
        setIsPresented(true);
    }

    const handleDismiss = () => {
        shouldRestoreFocusRef.current = true;
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
    const contextActionTestID = createAction?.testID ?? CreateTransactionMenuSelector.item(0);
    const pointerEvents = isOpen ? 'box-none' : 'none';
    const accessibilityVisibility = isOpen ? 'auto' : 'no-hide-descendants';
    const closeButtonClassName = isPresented ? 'opacity-100' : 'opacity-0';
    const stackGapClassName = fontScale >= CREATE_MENU_LARGE_TEXT_FONT_SCALE ? LARGE_TEXT_STACK_GAP_CLASSNAME : STACK_GAP_CLASSNAME;

    useEffect(() => {
        isOpenRef.current = isOpen;

        if (!isOpen) {
            const endPresentation = () => {
                setIsPresented(false);
            };
            const handleClosed = (finished?: boolean) => {
                'worklet';
                if (finished === true) {
                    scheduleOnRN(endPresentation);
                }
            };

            progress.set(withTiming(0, isReducedMotion ? REDUCED_MOTION_FADE_TIMING : FADE_TIMING, handleClosed));

            return;
        }

        const focusFirstTile = () => {
            if (isOpenRef.current && isDefined(firstTileRef.current)) {
                AccessibilityInfo.sendAccessibilityEvent(firstTileRef.current, 'focus');
            }
        };
        const handleOpened = (finished?: boolean) => {
            'worklet';
            if (finished === true) {
                scheduleOnRN(focusFirstTile);
            }
        };

        Toast.hide();
        progress.set(isReducedMotion ? withTiming(1, REDUCED_MOTION_FADE_TIMING, handleOpened) : withSpring(1, OPEN_SPRING, handleOpened));
    }, [isOpen, isReducedMotion, progress]);

    useEffect(() => {
        if (isOpen || !shouldRestoreFocusRef.current) {
            return;
        }

        shouldRestoreFocusRef.current = false;

        if (isDefined(triggerRef.current)) {
            AccessibilityInfo.sendAccessibilityEvent(triggerRef.current, 'focus');
        }
    }, [isOpen, triggerRef]);

    const closeButtonStyle = useAnimatedStyle(() => {
        const value = progress.get();
        const rotation = isReducedMotion ? CLOSE_ROTATION : CLOSE_ROTATION * value;

        return { transform: [{ rotate: `${rotation}deg` }] };
    });

    const scrimStyle = useAnimatedStyle(() => ({ opacity: progress.get() }));

    if (!isMounted) {
        return null;
    }

    return (
        <View
            style={StyleSheet.absoluteFill}
            pointerEvents={pointerEvents}
            accessibilityElementsHidden={!isOpen}
            importantForAccessibility={accessibilityVisibility}
            accessibilityViewIsModal={isOpen}
            onAccessibilityEscape={handleDismiss}
        >
            <View className="absolute inset-x-0 bottom-0 gap-xl px-lg pb-safe-or-[12px]" pointerEvents="box-none">
                <Animated.View className="absolute inset-x-0 -top-[80px] bottom-0" style={scrimStyle} pointerEvents="none">
                    <View className="h-[56px] bg-linear-to-b from-grouped-surface/0 to-grouped-surface" />
                    <View className="flex-1 bg-grouped-surface" />
                </Animated.View>

                <View className={stackGapClassName} pointerEvents="box-none">
                    <CreateMenuReveal progress={progress} order={3} className="flex-row gap-xl">
                        <CreateMenuChip
                            icon={UserIconNameEnum.Repeat}
                            label={t`Recurring`}
                            testID={CreateTransactionMenuSelector.Recurring}
                            onPress={handleCreateRecurring}
                        />
                        <CreateMenuChip
                            icon={UserIconNameEnum.Wallet}
                            label={t`Account`}
                            testID={CreateTransactionMenuSelector.AddAccount}
                            onPress={handleCreateAccount}
                        />
                    </CreateMenuReveal>

                    <View className={stackGapClassName} pointerEvents="box-none">
                        <CreateMenuReveal progress={progress} order={2} className="flex-row gap-xl">
                            <CreateMenuTile
                                icon={UserIconNameEnum.ArrowLeftRight}
                                label={t`Transfer`}
                                testID={CreateTransactionMenuSelector.Transfer}
                                variant="default"
                                onPress={handleCreateTransfer}
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
                            {isDefined(ReceiptScannerModule) ? <ReceiptSourceMenu onClose={onClose} /> : null}
                            <CreateMenuTile
                                ref={firstTileRef}
                                icon={UserIconNameEnum.TrendingDown}
                                label={t`Expense`}
                                testID={CreateTransactionMenuSelector.Expense}
                                variant="destructive"
                                onPress={handleCreateExpense}
                            />
                        </CreateMenuReveal>
                    </View>
                </View>

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

                    <View className={closeButtonClassName}>
                        <CircularActionButton
                            icon={UserIconNameEnum.Plus}
                            label={t`Close menu`}
                            onPress={handleDismiss}
                            animatedStyle={closeButtonStyle}
                            testID={CreateTransactionMenuSelector.Close}
                        />
                    </View>
                </View>
            </View>
        </View>
    );
};
