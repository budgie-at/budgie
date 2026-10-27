import { UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { AppToast } from '../../../@generic/component/app-toast/app-toast';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import { receiptScanProgressAtom } from '../../constant/receipt-scan-progress-atom.constant';
import { ReceiptScanToastStatusEnum } from '../../enum/receipt-scan-toast-status.enum';

import { ReceiptScanToastSelector } from './receipt-scan-toast.selector';

import type { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import type { ToastConfigParams } from 'react-native-toast-message';

type Props = Pick<ToastConfigParams<ReceiptScanToastStatusEnum>, 'text1' | 'text2' | 'props' | 'onPress'>;

const TOAST_ICON: Record<ReceiptScanToastStatusEnum, UserIconNameEnum> = {
    [ReceiptScanToastStatusEnum.READING]: UserIconNameEnum.Receipt,
    [ReceiptScanToastStatusEnum.DONE]: UserIconNameEnum.CircleCheck,
    [ReceiptScanToastStatusEnum.DUPLICATE]: UserIconNameEnum.Receipt,
    [ReceiptScanToastStatusEnum.NOT_FOUND]: UserIconNameEnum.Info
};
const PULSE_DURATION_MS = 750;
const PULSE_MIN_OPACITY = 0.3;

export const ReceiptScanToast = ({ text1, text2, props: status, onPress }: Props) => {
    const { t } = useLingui();
    const { current, total } = useAtomValue(receiptScanProgressAtom);
    const isReducedMotion = useReducedMotion();
    const pulse = useSharedValue(1);

    const isReading = status === ReceiptScanToastStatusEnum.READING;
    const readingTitle = total > 1 ? t`Reading receipts · ${current} of ${total}` : t`Reading receipt`;
    const title = isReading ? readingTitle : text1;
    const variant: ColorPaletteVariant = status === ReceiptScanToastStatusEnum.DONE ? 'positive' : 'secondary';
    const isPulsing = isReading && !isReducedMotion;
    const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.get() }));

    useEffect(() => {
        pulse.set(isPulsing ? withRepeat(withTiming(PULSE_MIN_OPACITY, { duration: PULSE_DURATION_MS }), -1, true) : 1);
    }, [isPulsing, pulse]);

    return (
        <Pressable className="w-full items-center" onPress={onPress} testID={ReceiptScanToastSelector.Toast(status)}>
            <AppToast text1={title} text2={text2} type="info">
                <View>
                    <CircleIcon icon={TOAST_ICON[status]} variant={variant} border={false} size={36} iconSize={20} />
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
