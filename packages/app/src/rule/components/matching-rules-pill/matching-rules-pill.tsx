import { UserIconNameEnum } from '@budgie/contracts';
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

const ENTRY_DELAY_MS = 500;

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
