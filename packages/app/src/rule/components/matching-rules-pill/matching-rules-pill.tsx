import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { MOTION_FADE_IN, MOTION_FADE_OUT } from '../../../@generic/constant/motion.constant';
import { useRuleFormModal } from '../../context/rule-form-modal.context';
import { RuleIndicatorPill } from '../rule-indicator-pill/rule-indicator-pill';

import { MatchingRulesPillSelector } from './matching-rules-pill.selector';

interface Props {
    readonly matchingRulesCount: number;
    readonly matchingRuleIds: readonly number[];
}

export const MatchingRulesPill = ({ matchingRulesCount, matchingRuleIds }: Props) => {
    const router = useRouter();
    const { t } = useLingui();
    const [openRuleForm] = useRuleFormModal();

    const handlePress = () => {
        const [matchingRuleId] = matchingRuleIds;

        if (matchingRuleIds.length === 1 && isDefined(matchingRuleId)) {
            openRuleForm({ ruleId: matchingRuleId });

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
            <Animated.View entering={MOTION_FADE_IN} exiting={MOTION_FADE_OUT}>
                <HapticPressable
                    testID={MatchingRulesPillSelector.Pill}
                    onPress={handlePress}
                    accessibilityLabel={label}
                    accessibilityRole="button"
                    className="min-h-[44px] max-w-full items-center justify-center self-center active:opacity-70"
                >
                    <RuleIndicatorPill icon={UserIconNameEnum.Workflow} className="min-h-[32px] px-lg" textClassName="text-[15px]">
                        {label}
                    </RuleIndicatorPill>
                </HapticPressable>
            </Animated.View>
        </View>
    );
};
