import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { cn } from '../../../@generic/utils/cn.util';
import { FILTER_CHIP_CLASS_NAME } from '../../constant/filter-chip-class-name.constant';

import { UncategorizedTransactionsPillSelector } from './uncategorized-transactions-pill.selector';

interface Props {
    readonly count: number;
    readonly onPress: () => void;
}

const ENTERING_ANIMATION = FadeIn.duration(180);

export const UncategorizedTransactionsPill = ({ count, onPress }: Props) => {
    const { t } = useLingui();

    const pillText = t({
        message: plural(count, {
            one: '# uncategorized',
            other: '# uncategorized'
        })
    });

    return (
        <Animated.View entering={ENTERING_ANIMATION}>
            <HapticPressable
                onPress={onPress}
                accessibilityRole="button"
                accessibilityLabel={pillText}
                testID={UncategorizedTransactionsPillSelector.Button}
                className={cn(FILTER_CHIP_CLASS_NAME, 'border-secondary-corner')}
            >
                <View className="size-[6px] rounded-full bg-warning-fill" />
                <Text className="text-warning-foreground text-[13px] font-medium" numberOfLines={1}>
                    {pillText}
                </Text>
            </HapticPressable>
        </Animated.View>
    );
};
