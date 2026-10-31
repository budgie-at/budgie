import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { AppToast } from '../../../@generic/component/app-toast/app-toast';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import { ReceiptScanToastStatusEnum } from '../../enum/receipt-scan-toast-status.enum';

import { ReceiptScanToastSelector } from './receipt-scan-toast.selector';

import type { ToastConfigParams } from 'react-native-toast-message';

type Props = Pick<ToastConfigParams<ReceiptScanToastStatusEnum>, 'text1' | 'text2' | 'props' | 'onPress'>;

const TOAST_ICON: Record<ReceiptScanToastStatusEnum, UserIconNameEnum> = {
    [ReceiptScanToastStatusEnum.READING]: UserIconNameEnum.Receipt,
    [ReceiptScanToastStatusEnum.DUPLICATE]: UserIconNameEnum.Receipt,
    [ReceiptScanToastStatusEnum.NOT_FOUND]: UserIconNameEnum.Info
};
const PULSE_DURATION_MS = 750;
const PULSE_MIN_OPACITY = 0.3;

export const ReceiptScanToast = ({ text1, text2, props: status, onPress }: Props) => {
    const { t } = useLingui();
    const isReducedMotion = useReducedMotion();
    const pulse = useSharedValue(1);

    const isReading = status === ReceiptScanToastStatusEnum.READING;
    const title = isReading ? t`Reading receipt` : text1;
    const isPulsing = isReading && !isReducedMotion;
    const accessibilityHint = status === ReceiptScanToastStatusEnum.DUPLICATE ? t`Opens the transaction` : void 0;
    const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.get() }));

    useEffect(() => {
        pulse.set(isPulsing ? withRepeat(withTiming(PULSE_MIN_OPACITY, { duration: PULSE_DURATION_MS }), -1, true) : 1);
    }, [isPulsing, pulse]);

    return (
        <Pressable
            className="w-full items-center"
            accessibilityRole="button"
            accessibilityHint={accessibilityHint}
            onPress={onPress}
            testID={ReceiptScanToastSelector.Toast(status)}
        >
            <AppToast text1={title} text2={text2} type="info">
                <View>
                    <CircleIcon icon={TOAST_ICON[status]} variant="secondary" border={false} size={36} iconSize={20} />
                    {isReading ? (
                        <Animated.View
                            className="absolute -inset-[3px] rounded-full border-2 border-default-foreground"
                            style={pulseStyle}
                        />
                    ) : null}
                </View>
            </AppToast>
        </Pressable>
    );
};
