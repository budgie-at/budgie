import { UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { MatchingRulesSelectors } from '../../../@e2e/selectors/matching-rules.selector';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';

const ENTRY_DELAY_MS = 500;

interface Props {
    readonly matchingRulesCount: number;
}

export const MatchingRulesPill = ({ matchingRulesCount }: Props) => {
    const router = useRouter();

    const handlePress = () => {
        router.push('/settings/rules');
    };

    const label = matchingRulesCount === 1 ? t`${matchingRulesCount} matching rule` : t`${matchingRulesCount} matching rules`;

    return (
        <View className="items-start">
            <Animated.View entering={FadeIn.delay(ENTRY_DELAY_MS).duration(200)} exiting={FadeOut.duration(200)}>
                <HapticPressable
                    testID={MatchingRulesSelectors.Pill}
                    onPress={handlePress}
                    className="flex-row items-center gap-xs px-lg py-sm bg-ghost-background rounded-xl shadow-sm"
                >
                    <Icon icon={UserIconNameEnum.Workflow} size={14} className="text-secondary-foreground" />
                    <Text className="text-xs text-secondary-foreground font-medium">{label}</Text>
                </HapticPressable>
            </Animated.View>
        </View>
    );
};
