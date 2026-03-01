import { RuleConditionMatchTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { NotificationFeedbackType } from 'expo-haptics/src/Haptics.types';
import { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, cancelAnimation, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { ruleRepository } from '../../../@generic/drizzle/db/db';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { useRuleFormModal } from '../../context/rule-form-modal.context';
import { useSuggestRuleModal } from '../../context/suggest-rule-modal.context';
import { SuggestRuleDataInterface } from '../../interface/suggest-rule-data.interface';
import { buildSuggestRuleConditions } from '../../util/build-suggest-rule-conditions.util';
import { findDuplicateRule } from '../../util/find-duplicate-rule.util';

const ENTRY_DELAY_MS = 500;
const SPARKLE_ANIMATION_DURATION = 600;
const SUCCESS_EXIT_DELAY_MS = 600;
const SUCCESS_TOTAL_DURATION_MS = 1100;
const SPARKLE_ICON_SIZE = 14;
const CHECK_ICON_SIZE = 14;
const SPARKLE_ROTATION_DEGREES = 360;

interface Props {
    readonly suggestRuleData: SuggestRuleDataInterface;
    readonly compact?: boolean;
    readonly onRuleCreated: () => void;
}

// eslint-disable-next-line max-statements -- Component with animation, haptics, duplicate detection, and modal handlers
export const RuleSuggestionPill = (props: Props) => {
    const { suggestRuleData, compact = false, onRuleCreated } = props;

    const [isSuccess, setIsSuccess] = useState(false);
    const [hapticNotification] = useVibration();
    const [openSuggestRule] = useSuggestRuleModal();
    const { openRuleForm } = useRuleFormModal();

    const sparkleRotation = useSharedValue(0);

    useEffect(() => {
        sparkleRotation.value = withTiming(SPARKLE_ROTATION_DEGREES, { duration: SPARKLE_ANIMATION_DURATION });

        return () => void cancelAnimation(sparkleRotation);
    }, [sparkleRotation]);

    const sparkleAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${sparkleRotation.value}deg` }]
    }));

    const handleOpenSuggestRule = async () => {
        const result = await openSuggestRule({ suggestRuleData });

        if (result === 'created') {
            setIsSuccess(true);
            hapticNotification(NotificationFeedbackType.Success);
            setTimeout(onRuleCreated, SUCCESS_TOTAL_DURATION_MS);
        }
    };

    const handlePress = async () => {
        const conditions = buildSuggestRuleConditions(suggestRuleData);
        const existingRules = await ruleRepository.findAllWithActionsAndCategories();
        const duplicateRule = findDuplicateRule(conditions, RuleConditionMatchTypeEnum.ALL, existingRules);

        if (!isDefined(duplicateRule)) {
            await handleOpenSuggestRule();

            return;
        }

        Alert.alert(t`Duplicate rule`, t`A rule with the same conditions already exists.`, [
            { text: t`Cancel`, style: 'cancel' },
            { text: t`Edit existing`, onPress: () => void openRuleForm({ ruleId: duplicateRule.id }) },
            { text: t`Create anyway`, onPress: () => void handleOpenSuggestRule() }
        ]);
    };

    const handlePillPress = () => void handlePress();

    const successContent = (
        <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.delay(SUCCESS_EXIT_DELAY_MS).duration(300)}
            className="flex-row items-center gap-xs px-lg py-sm bg-ghost-background rounded-xl shadow-sm"
        >
            <Icon icon={UserIconNameEnum.CircleCheck} size={CHECK_ICON_SIZE} className="text-secondary-foreground" />
            <Text className="text-xs text-secondary-foreground font-medium">
                <Trans>Rule created</Trans>
            </Text>
        </Animated.View>
    );

    const pillContent = (
        <HapticPressable
            onPress={handlePillPress}
            className="flex-row items-center gap-xs px-lg py-sm bg-ghost-background rounded-xl shadow-sm"
        >
            <Animated.View style={sparkleAnimatedStyle}>
                <Icon icon={UserIconNameEnum.Cog} size={SPARKLE_ICON_SIZE} className="text-secondary-foreground" />
            </Animated.View>
            <Text className="text-xs text-secondary-foreground font-medium">
                <Trans>Quick rule</Trans>
            </Text>
        </HapticPressable>
    );
    const content = isSuccess ? successContent : pillContent;

    if (compact) {
        return <View className="shrink-0">{content}</View>;
    }

    if (isSuccess) {
        return <View className="items-start">{successContent}</View>;
    }

    return (
        <View className="items-start">
            <Animated.View entering={FadeIn.delay(ENTRY_DELAY_MS).duration(200)} exiting={FadeOut.duration(200)}>
                {pillContent}
            </Animated.View>
        </View>
    );
};
