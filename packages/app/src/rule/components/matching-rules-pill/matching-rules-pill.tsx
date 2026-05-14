import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';

import { MatchingRulesPillSelector } from './matching-rules-pill.selector';

const ENTRY_DELAY_MS = 500;

interface Props {
    readonly matchingRulesCount: number;
}

export const MatchingRulesPill = ({ matchingRulesCount }: Props) => {
    const router = useRouter();
    const { t } = useLingui();

    const handlePress = () => {
        router.push('/settings/rules');
    };

    const label = matchingRulesCount === 1 ? t`1 matching rule` : t`${matchingRulesCount} matching rules`;

    return (
        <View className="items-start">
            <Animated.View entering={FadeIn.delay(ENTRY_DELAY_MS).duration(200)} exiting={FadeOut.duration(200)}>
                <HapticPressable
                    testID={MatchingRulesPillSelector.Pill}
                    onPress={handlePress}
                    className="flex-row items-center gap-xs rounded-full border border-secondary-corner bg-secondary-background px-md py-xs self-start max-w-[85%]"
                >
                    <Icon icon={UserIconNameEnum.Workflow} size={14} className="text-secondary-foreground" />
                    <Text className="text-xs text-secondary-foreground font-medium shrink" numberOfLines={1} ellipsizeMode="tail">
                        {label}
                    </Text>
                </HapticPressable>
            </Animated.View>
        </View>
    );
};
