import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cn } from 'cn';
import { ComponentProps } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { isNotEmptyString } from '@rnw-community/shared';

import { useThemeContext } from '../../../theme/context/theme.context';
import { dark, light } from '../../../theme/provider/theme.provider';
import { Icon } from '../icon/icon';

interface Props extends ComponentProps<typeof TextInput> {
    readonly value: string;
    readonly onChangeText: (value: string) => void;
    readonly containerClassName?: string;
    readonly inputClassName?: string;
}

const ANIMATION_DURATION = 140;
const ENTERING = FadeIn.duration(ANIMATION_DURATION);
const EXITING = FadeOut.duration(ANIMATION_DURATION);

export const SearchInput = (props: Props) => {
    const {
        value,
        onChangeText,
        containerClassName,
        inputClassName,
        className,
        autoCapitalize,
        autoCorrect,
        placeholderTextColor,
        returnKeyType,
        submitBehavior,
        ...rest
    } = props;
    const { t } = useLingui();
    const { isDarkColorSchema } = useThemeContext();

    const showClear = isNotEmptyString(value);
    const theme = isDarkColorSchema ? dark : light;
    const resolvedAutoCapitalize = autoCapitalize ?? 'none';
    const resolvedAutoCorrect = autoCorrect ?? false;
    const resolvedPlaceholderTextColor = placeholderTextColor ?? theme['--color-secondary-foreground'];
    const resolvedReturnKeyType = returnKeyType ?? 'done';
    const resolvedSubmitBehavior = submitBehavior ?? 'blurAndSubmit';

    const handleClear = () => {
        onChangeText('');
    };

    return (
        <View
            className={cn(
                'h-[50px] flex-row items-center rounded-5xl border border-secondary-corner bg-secondary-background px-lg',
                containerClassName
            )}
        >
            <Icon icon={UserIconNameEnum.Search} size={20} className="text-secondary-foreground" />
            <TextInput
                {...rest}
                value={value}
                onChangeText={onChangeText}
                placeholderTextColor={resolvedPlaceholderTextColor}
                autoCapitalize={resolvedAutoCapitalize}
                autoCorrect={resolvedAutoCorrect}
                returnKeyType={resolvedReturnKeyType}
                submitBehavior={resolvedSubmitBehavior}
                className={cn('ml-sm flex-1 text-md text-primary', className, inputClassName)}
            />
            <View className="ml-sm h-[32px] w-[32px] items-center justify-center">
                {showClear ? (
                    <Animated.View entering={ENTERING} exiting={EXITING}>
                        <Pressable
                            accessibilityLabel={t`Tap to clear`}
                            accessibilityRole="button"
                            className="h-[32px] w-[32px] items-center justify-center rounded-full bg-primary/10"
                            hitSlop={8}
                            onPress={handleClear}
                        >
                            <Icon icon={UserIconNameEnum.X} size={16} className="text-primary" />
                        </Pressable>
                    </Animated.View>
                ) : null}
            </View>
        </View>
    );
};
