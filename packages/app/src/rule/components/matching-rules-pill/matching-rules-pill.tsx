import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { RuleIndicatorPill } from '../rule-indicator-pill/rule-indicator-pill';

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
        <View className="items-center">
            <Animated.View entering={FadeIn.delay(ENTRY_DELAY_MS).duration(200)} exiting={FadeOut.duration(200)}>
                <HapticPressable testID={MatchingRulesPillSelector.Pill} onPress={handlePress} className="self-center">
                    <RuleIndicatorPill icon={UserIconNameEnum.Workflow}>{label}</RuleIndicatorPill>
                </HapticPressable>
            </Animated.View>
        </View>
    );
};
