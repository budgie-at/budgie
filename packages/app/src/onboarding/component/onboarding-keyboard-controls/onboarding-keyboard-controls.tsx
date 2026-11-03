import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { FocusedInputEvents, KeyboardController, useKeyboardState } from 'react-native-keyboard-controller';

import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';

export const OnboardingKeyboardControls = () => {
    const { t } = useLingui();
    const [inputs, setInputs] = useState({ current: 0, count: 0 });
    const isKeyboardVisible = useKeyboardState(state => state.isVisible);
    const isPreviousDisabled = inputs.current === 0;
    const isNextDisabled = inputs.current >= inputs.count - 1;

    const previousAccessibilityState = { disabled: isPreviousDisabled };
    const nextAccessibilityState = { disabled: isNextDisabled };
    const handlePreviousPress = () => void KeyboardController.setFocusTo('prev');
    const handleNextPress = () => void KeyboardController.setFocusTo('next');
    const handleDonePress = () => void KeyboardController.dismiss();

    useEffect(() => {
        const subscription = FocusedInputEvents.addListener('focusDidSet', setInputs);

        return () => void subscription.remove();
    }, []);

    if (!isKeyboardVisible) {
        return null;
    }

    return (
        <View className="flex-row items-center justify-between">
            <View className="flex-row">
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t`Previous field`}
                    accessibilityState={previousAccessibilityState}
                    disabled={isPreviousDisabled}
                    onPress={handlePreviousPress}
                    className={cn('h-[44px] w-[44px] items-center justify-center active:opacity-60', isPreviousDisabled && 'opacity-40')}
                >
                    <Icon icon={UserIconNameEnum.ChevronUp} size={22} className="text-primary" />
                </Pressable>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t`Next field`}
                    accessibilityState={nextAccessibilityState}
                    disabled={isNextDisabled}
                    onPress={handleNextPress}
                    className={cn('h-[44px] w-[44px] items-center justify-center active:opacity-60', isNextDisabled && 'opacity-40')}
                >
                    <Icon icon={UserIconNameEnum.ChevronDown} size={22} className="text-primary" />
                </Pressable>
            </View>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={t`Done`}
                onPress={handleDonePress}
                className="min-h-[44px] min-w-[44px] items-center justify-center active:opacity-60"
            >
                <Text className="text-primary text-[17px] font-medium">
                    <Trans>Done</Trans>
                </Text>
            </Pressable>
        </View>
    );
};
