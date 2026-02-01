import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { EmptyFn } from '@rnw-community/shared';

import { SuggestRuleSelectors } from '../../../@e2e/selectors/suggest-rule.selector';
import { SuggestRulePillItem } from '../suggest-rule-pill-item/suggest-rule-pill-item';

interface Props {
    readonly onPress: EmptyFn;
}

const ANIMATION_DURATION = 200;
const STAGGER_DELAY = 60;

export const SuggestRuleSection = ({ onPress }: Props) => {
    const { t } = useLingui();

    return (
        <View className="h-10 items-end justify-center overflow-hidden" testID={SuggestRuleSelectors.Section}>
            <Animated.View
                entering={FadeIn.duration(ANIMATION_DURATION)}
                exiting={FadeOut.duration(ANIMATION_DURATION)}
                className="flex-row items-center overflow-hidden gap-sm"
            >
                <SuggestRulePillItem
                    label={t`Create Rule`}
                    icon={UserIconNameEnum.Zap}
                    index={0}
                    animationDuration={ANIMATION_DURATION}
                    staggerDelay={STAGGER_DELAY}
                    onPress={onPress}
                    testID={SuggestRuleSelectors.AddRuleButton}
                />
            </Animated.View>
        </View>
    );
};
