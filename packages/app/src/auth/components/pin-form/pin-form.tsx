import { NotificationFeedbackType } from 'expo-haptics';
import { ReactNode, useEffect, useEffectEvent, useRef } from 'react';
import { AccessibilityInfo, ActivityIndicator, ScrollView, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { EmptyFn, isNotEmptyString } from '@rnw-community/shared';

import { Shake } from '../../../@generic/component/shake/shake';
import { MAX_CHROME_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/max-chrome-font-size-multiplier.constant';
import { EASE_OUT } from '../../../@generic/constant/motion.constant';
import { useIsLargeTextSize } from '../../../@generic/hook/use-is-large-text-size.hook';
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

const CONTENT_CONTAINER_STYLE = { flexGrow: 1, paddingBottom: 16 };

const ERROR_ENTERING = FadeIn.duration(PIN_ERROR_FADE_DURATION_MS).easing(EASE_OUT);

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
    const filledDotsCount = hasError || isAccepted ? PIN_LENGTH : currentInput.length;
    const classNames = {
        keypadRowGapClassName: isCompact ? 'gap-y-xl' : 'gap-y-3xl',
        footerClassName: isCompact ? 'min-h-[48px] mb-md' : 'min-h-[56px] mb-3xl'
    };
    const isFooterAboveKeypad = useIsLargeTextSize() && isCompact;
    const footerContent = <View className={cn('justify-center', classNames.footerClassName)}>{footer}</View>;

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
        <ScrollView
            className="flex-1"
            contentContainerStyle={CONTENT_CONTAINER_STYLE}
            contentInsetAdjustmentBehavior="never"
            testID={PinFormSelector.Container}
        >
            <View className="grow items-center justify-end">
                {header}

                <View className="mt-xl">
                    <Shake isEnabled={hasError}>
                        <PinFormDots filled={filledDotsCount} isError={hasError} isAccepted={isAccepted} />
                    </Shake>
                </View>

                <View className="min-h-[40px] mt-lg">
                    {isBusy ? <ActivityIndicator size="small" colorClassName="accent-secondary-foreground" /> : null}

                    {hasError && !isBusy ? (
                        <Animated.Text
                            maxFontSizeMultiplier={MAX_CHROME_FONT_SIZE_MULTIPLIER}
                            entering={ERROR_ENTERING}
                            className="text-sm font-medium text-destructive-strong text-center"
                            testID={PinFormSelector.Error}
                            accessibilityLiveRegion="assertive"
                        >
                            {error}
                        </Animated.Text>
                    ) : null}
                </View>
            </View>

            {isFooterAboveKeypad ? footerContent : null}

            <View className={cn('items-center', classNames.keypadRowGapClassName)}>
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

                    <PinFormDeleteButton {...(canDelete && { onPress: onDeletePress })} />
                </View>
            </View>

            {isFooterAboveKeypad ? null : footerContent}
        </ScrollView>
    );
};
