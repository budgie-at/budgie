import { UserIconNameEnum } from '@budgie/contracts';
import { ComponentProps, Ref } from 'react';
import { TextInput, View } from 'react-native';
import Animated, { Keyframe } from 'react-native-reanimated';

import { isNotEmptyString } from '@rnw-community/shared';

import { EASE_OUT, MOTION_BASE_DURATION, MOTION_FADE_OUT } from '../../constant/motion.constant';
import { cn } from '../../utils/cn.util';
import { Icon } from '../icon/icon';
import { InputClearButton } from '../input-clear-button/input-clear-button';

interface Props extends ComponentProps<typeof TextInput> {
    readonly value: string;
    readonly onChangeText: (value: string) => void;
    readonly containerClassName?: string;
    readonly inputClassName?: string;
    readonly clearButtonClassName?: string;
    readonly ref?: Ref<TextInput>;
}

const CLEAR_ENTER_SCALE = 0.9;
const ENTERING = new Keyframe({
    0: { opacity: 0, transform: [{ scale: CLEAR_ENTER_SCALE }] },
    100: { opacity: 1, transform: [{ scale: 1 }], easing: EASE_OUT }
}).duration(MOTION_BASE_DURATION);

export const SearchInput = (props: Props) => {
    const {
        value,
        onChangeText,
        containerClassName,
        inputClassName,
        clearButtonClassName,
        className,
        autoCapitalize,
        autoCorrect,
        returnKeyType,
        submitBehavior,
        ...rest
    } = props;
    const showClear = isNotEmptyString(value);
    const resolvedAutoCapitalize = autoCapitalize ?? 'none';
    const resolvedAutoCorrect = autoCorrect ?? false;
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
                placeholderTextColorClassName="accent-secondary-foreground"
                {...rest}
                value={value}
                onChangeText={onChangeText}
                autoCapitalize={resolvedAutoCapitalize}
                autoCorrect={resolvedAutoCorrect}
                returnKeyType={resolvedReturnKeyType}
                submitBehavior={resolvedSubmitBehavior}
                className={cn('ml-sm flex-1 text-md text-primary', className, inputClassName)}
            />
            <View className={cn('ml-sm h-[32px] w-[32px] items-center justify-center', clearButtonClassName)}>
                {showClear ? (
                    <Animated.View entering={ENTERING} exiting={MOTION_FADE_OUT}>
                        <InputClearButton className={clearButtonClassName} onPress={handleClear} />
                    </Animated.View>
                ) : null}
            </View>
        </View>
    );
};
