import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { SuggestRuleSelectors } from '../../../@e2e/selectors/suggest-rule.selector';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly onPress: () => void;
}

export const SuggestRulePill = ({ onPress }: Props) => (
    <Animated.View entering={FadeIn.duration(300)} className="items-center py-sm">
        <HapticPressable
            testID={SuggestRuleSelectors.AddRuleButton}
            className="flex-row items-center gap-x-sm rounded-full border border-primary/15 bg-ghost-background px-xl py-sm"
            onPress={onPress}
        >
            <Icon icon={UserIconNameEnum.Sparkles} size={14} className="text-primary" />
            <Text className="text-xs font-medium text-primary">
                <Trans>Automate this?</Trans>
            </Text>
        </HapticPressable>
    </Animated.View>
);
