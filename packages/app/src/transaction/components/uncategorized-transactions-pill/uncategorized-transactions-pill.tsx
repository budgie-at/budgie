import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';

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
                className="rounded-2xl border border-warning-corner bg-warning-background px-xl py-sm flex-row items-center gap-x-sm"
            >
                <Icon icon={UserIconNameEnum.BadgeQuestionMark} className="text-warning-foreground" size={14} />
                <Text className="text-warning-foreground text-sm font-medium" numberOfLines={1}>
                    {pillText}
                </Text>
            </HapticPressable>
        </Animated.View>
    );
};
