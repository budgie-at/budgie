import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { useRuleFormModal } from '../../context/rule-form-modal.context';
import { RuleIndicatorPill } from '../rule-indicator-pill/rule-indicator-pill';

import { MatchingRulesPillSelector } from './matching-rules-pill.selector';

import type { MatchingRulesPillPropsInterface } from '../../interface/matching-rules-pill-props.interface';

export const MatchingRulesPill = ({ matchingRulesCount, matchingRuleIds }: MatchingRulesPillPropsInterface) => {
    const router = useRouter();
    const { t } = useLingui();
    const { openRuleForm } = useRuleFormModal();

    const handlePress = () => {
        const [matchingRuleId] = matchingRuleIds;

        if (matchingRuleIds.length === 1 && isDefined(matchingRuleId)) {
            void openRuleForm({ ruleId: matchingRuleId });

            return;
        }

        const matchingRuleIdsValue = matchingRuleIds.join(',');
        router.push({ pathname: '/matching-rules', params: { ruleIds: matchingRuleIdsValue } });
    };

    const label = t({
        message: plural(matchingRulesCount, {
            one: '# matching rule',
            other: '# matching rules'
        })
    });

    return (
        <View className="items-center">
            <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)}>
                <HapticPressable testID={MatchingRulesPillSelector.Pill} onPress={handlePress} className="self-center">
                    <RuleIndicatorPill icon={UserIconNameEnum.Workflow}>{label}</RuleIndicatorPill>
                </HapticPressable>
            </Animated.View>
        </View>
    );
};
