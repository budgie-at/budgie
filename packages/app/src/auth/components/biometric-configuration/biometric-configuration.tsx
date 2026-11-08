import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useEffectEvent } from 'react';
import { AccessibilityInfo, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { isNotEmptyString } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { EASE_OUT } from '../../../@generic/constant/motion.constant';
import { PIN_ERROR_FADE_DURATION_MS, PIN_STEP_FADE_DURATION_MS } from '../../constant/pin-motion.constant';
import { useAuthContext } from '../../context/auth.context';
import { PinSetupModeEnum } from '../../enum/pin-setup-mode.enum';
import { PinSetupStepEnum } from '../../enum/pin-setup-step.enum';
import { getPinSetupMeta } from '../../utils/get-pin-setup-meta.util';
import { BiometricBenefitRow } from '../biometric-benefit-row/biometric-benefit-row';
import { PinFormSelector } from '../pin-form/pin-form.selector';

interface Props {
    readonly isLoading: boolean;
    readonly error: string | null;
    readonly onSubmit: (enableBiometrics: boolean) => void;
}

const STEP_ENTERING = FadeIn.duration(PIN_STEP_FADE_DURATION_MS).easing(EASE_OUT);

const ERROR_ENTERING = FadeIn.duration(PIN_ERROR_FADE_DURATION_MS).easing(EASE_OUT);

export const BiometricConfiguration = ({ isLoading, error, onSubmit }: Props) => {
    const { t } = useLingui();
    const { isFaceIdAvailable, isTouchIdAvailable } = useAuthContext();
    const { title, description, icon, iconVariant } = getPinSetupMeta(
        PinSetupModeEnum.CREATE,
        PinSetupStepEnum.BIOMETRIC,
        isFaceIdAvailable,
        isTouchIdAvailable
    );
    const enableLabel = isFaceIdAvailable ? t`Use Face ID` : t`Use Touch ID`;

    const benefits = [
        { icon: UserIconNameEnum.Zap, text: t`Unlock quickly without typing your PIN` },
        { icon: UserIconNameEnum.ShieldCheck, text: t`Biometric data never leaves this phone` },
        { icon: UserIconNameEnum.KeyRound, text: t`Your PIN still works any time` }
    ];

    const isErrorVisible = isNotEmptyString(error) && !isLoading;

    const announceTitle = useEffectEvent(() => void AccessibilityInfo.announceForAccessibility(t(title)));
    const announceError = useEffectEvent(() => void AccessibilityInfo.announceForAccessibility(error ?? ''));

    useEffect(() => {
        announceTitle();
    }, []);

    useEffect(() => {
        if (isErrorVisible) {
            announceError();
        }
    }, [isErrorVisible]);

    const handleEnable = () => void onSubmit(true);
    const handleSkip = () => void onSubmit(false);

    return (
        <Animated.View entering={STEP_ENTERING} className="flex-1">
            <View className="flex-1 justify-center gap-y-7xl">
                <View className="items-center gap-y-5xl">
                    <CircleIcon icon={icon} variant={iconVariant} size={88} iconSize={44} radius={28} />

                    <View className="items-center gap-y-md px-xl">
                        <Text className="text-3xl font-semibold tracking-tight text-primary text-center" accessibilityRole="header">
                            {t(title)}
                        </Text>

                        <Text className="text-sm text-secondary-foreground text-center max-w-[300px]">{t(description)}</Text>
                    </View>
                </View>

                <Card variant="secondary" size="md" className="gap-y-xl">
                    {benefits.map(benefit => (
                        <BiometricBenefitRow key={benefit.text} icon={benefit.icon} text={benefit.text} />
                    ))}
                </Card>
            </View>

            <View className="gap-y-md pb-xl">
                <View className="min-h-[52px] justify-end pb-md">
                    {isErrorVisible ? (
                        <Animated.Text
                            entering={ERROR_ENTERING}
                            className="text-sm font-medium text-destructive-foreground text-center"
                            testID={PinFormSelector.Error}
                        >
                            {error}
                        </Animated.Text>
                    ) : null}
                </View>

                <Button
                    testID={PinFormSelector.ContinueButton}
                    variant="cta"
                    content={enableLabel}
                    onPress={handleEnable}
                    isLoading={isLoading}
                />

                <Button
                    testID={PinFormSelector.SkipBiometricButton}
                    variant="ghost"
                    content={t`Use PIN only`}
                    onPress={handleSkip}
                    disabled={isLoading}
                    className="border-0 bg-transparent"
                />
            </View>
        </Animated.View>
    );
};
