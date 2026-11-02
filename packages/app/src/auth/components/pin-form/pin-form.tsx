import { NotificationFeedbackType } from 'expo-haptics';
import { ReactNode, useEffect, useEffectEvent, useRef } from 'react';
import { AccessibilityInfo, ActivityIndicator, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { EmptyFn, isNotEmptyString } from '@rnw-community/shared';

import { Shake } from '../../../@generic/component/shake/shake';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { PIN_LENGTH } from '../../constant/pin-length.constant';
import { PIN_ERROR_FADE_DURATION_MS } from '../../constant/pin-motion.constant';
import { PinFormStatusEnum } from '../../enum/pin-form-status.enum';
import { useIsCompactPinLayout } from '../../hook/use-is-compact-pin-layout.hook';
import { PinFormBiometricButton } from '../pin-form-biometric-button/pin-form-biometric-button';
import { PinFormButton } from '../pin-form-button/pin-form-button';
import { PinFormDeleteButton } from '../pin-form-delete-button/pin-form-delete-button';
import { PinFormDots } from '../pin-form-dots/pin-form-dots';

import { PinFormSelector } from './pin-form.selector';

interface Props {
    readonly header: ReactNode;
    readonly currentInput: string;
    readonly error: string | null;
    readonly status: PinFormStatusEnum;
    readonly onDigitPress: (digit: string) => void;
    readonly onDeletePress: EmptyFn;
    readonly children?: ReactNode;
    readonly footer?: ReactNode;
}

const DIGIT_ROWS = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9']
] as const;

export const PinForm = ({
    header,
    currentInput,
    error,
    status,
    onDigitPress,
    onDeletePress,
    children = <PinFormBiometricButton />,
    footer
}: Props) => {
    const [hapticNotification] = useVibration();
    const isCompact = useIsCompactPinLayout();
    const hadErrorRef = useRef(false);

    const isAccepted = status === PinFormStatusEnum.ACCEPTED;
    const isBusy = status === PinFormStatusEnum.BUSY;
    const isDisabled = status !== PinFormStatusEnum.READY;
    const hasError = isNotEmptyString(error);
    const canDelete = isNotEmptyString(currentInput) && !isDisabled;
    const isErrorVisible = hasError && !isBusy;
    const filledDotsCount = hasError || isAccepted ? PIN_LENGTH : currentInput.length;
    const keypadRowGapClassName = isCompact ? 'gap-y-xl' : 'gap-y-3xl';
    const footerClassName = isCompact ? 'h-[48px] mb-md' : 'h-[56px] mb-3xl';

    const signalRejection = useEffectEvent(() => {
        hapticNotification(NotificationFeedbackType.Error);
        AccessibilityInfo.announceForAccessibility(error ?? '');
    });

    useEffect(() => {
        if (hasError && !hadErrorRef.current) {
            signalRejection();
        }

        hadErrorRef.current = hasError;
    }, [hasError]);

    return (
        <View className="flex-1" testID={PinFormSelector.Container}>
            <View className="flex-1 items-center justify-end">
                {header}

                <View className="mt-xl">
                    <Shake isEnabled={hasError}>
                        <PinFormDots filled={filledDotsCount} isError={hasError} isAccepted={isAccepted} />
                    </Shake>
                </View>

                <View className="min-h-[40px] mt-lg">
                    {isBusy ? <ActivityIndicator size="small" colorClassName="accent-secondary-foreground" /> : null}

                    {isErrorVisible ? (
                        <Animated.Text
                            entering={FadeIn.duration(PIN_ERROR_FADE_DURATION_MS)}
                            className="text-sm font-medium text-destructive-foreground text-center"
                            testID={PinFormSelector.Error}
                            accessibilityLiveRegion="assertive"
                        >
                            {error}
                        </Animated.Text>
                    ) : null}
                </View>
            </View>

            <View className={cn('items-center', keypadRowGapClassName)}>
                {DIGIT_ROWS.map(row => (
                    <View key={row.join('')} className="flex-row gap-x-7xl">
                        {row.map(digit => (
                            <PinFormButton key={digit} digit={digit} onPress={onDigitPress} disabled={isDisabled} />
                        ))}
                    </View>
                ))}

                <View className="flex-row gap-x-7xl">
                    {children}

                    <PinFormButton digit="0" onPress={onDigitPress} disabled={isDisabled} />

                    <PinFormDeleteButton isVisible={canDelete} onPress={onDeletePress} />
                </View>
            </View>

            <View className={cn('justify-center', footerClassName)}>{footer}</View>
        </View>
    );
};
