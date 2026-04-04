import { RuleActionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { NotificationFeedbackType } from 'expo-haptics/src/Haptics.types';
import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut, runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { ruleRepository } from '../../../@generic/drizzle/db/db';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { UpdateRuleDataInterface } from '../../interface/update-rule-data.interface';
import { ruleEngineService } from '../../service/rule-engine.service';
import { ruleService } from '../../service/rule.service';

const ENTRY_SPRING_CONFIG = { damping: 20, stiffness: 80 };
const SWIPE_THRESHOLD = 80;
const SUCCESS_AUTO_DISMISS_MS = 2000;
const ERROR_AUTO_DISMISS_MS = 3000;
const ENTRY_TRANSLATE_Y = 16;
const SNAP_BACK_SPRING_CONFIG = { damping: 20, stiffness: 200 };
const SLIDE_OUT_DISTANCE = 300;
const ZAP_ICON_SIZE = 14;
const CHECK_ICON_SIZE = 14;

type CardStatus = 'idle' | 'creating' | 'success' | 'error';

interface Props {
    readonly updateRuleData: UpdateRuleDataInterface;
    readonly onRuleUpdated: () => void;
    readonly onDismiss: () => void;
}

// eslint-disable-next-line max-lines-per-function, max-statements -- Card component with gesture handling, animations, and multiple render states
export const RuleUpdateCard = (props: Props) => {
    const { updateRuleData, onRuleUpdated, onDismiss } = props;

    const [status, setStatus] = useState<CardStatus>('idle');
    const [appliedCount, setAppliedCount] = useState(0);
    const [hapticNotification, hapticImpact] = useVibration();

    const translateX = useSharedValue(0);
    const translateY = useSharedValue(ENTRY_TRANSLATE_Y);
    const opacity = useSharedValue(0);

    translateY.value = withSpring(0, ENTRY_SPRING_CONFIG);
    opacity.value = withSpring(1, ENTRY_SPRING_CONFIG);

    const descriptionText = t`Update rule?`;

    const handleSwipeThresholdReached = () => {
        hapticImpact(ImpactFeedbackStyle.Light);
    };

    const panGesture = Gesture.Pan()
        .activeOffsetX(10)
        .onUpdate(event => {
            const clampedTranslation = Math.max(0, event.translationX);
            translateX.value = clampedTranslation;

            if (clampedTranslation >= SWIPE_THRESHOLD) {
                runOnJS(handleSwipeThresholdReached)();
            }
        })
        .onEnd(event => {
            if (event.translationX >= SWIPE_THRESHOLD) {
                translateX.value = withSpring(SLIDE_OUT_DISTANCE, SNAP_BACK_SPRING_CONFIG);
                opacity.value = withSpring(0, SNAP_BACK_SPRING_CONFIG);
                runOnJS(onDismiss)();
            } else {
                translateX.value = withSpring(0, SNAP_BACK_SPRING_CONFIG);
            }
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
        opacity: opacity.value
    }));

    // eslint-disable-next-line max-statements -- Async handler with rule load, merge, update, apply, and error paths
    const handleYesPress = async () => {
        setStatus('creating');

        try {
            const allRules = await ruleRepository.findAllWithActionsAndCategories();
            const existingRule = allRules.find(rule => rule.id === updateRuleData.ruleId);

            if (!isDefined(existingRule)) {
                setStatus('error');
                setTimeout(onDismiss, ERROR_AUTO_DISMISS_MS);

                return;
            }

            const preservedActions = existingRule.actions
                .filter(action => action.type !== RuleActionTypeEnum.SET_CATEGORY && action.type !== RuleActionTypeEnum.ADD_TAG)
                .map(action => ({
                    type: action.type,
                    categoryId: action.categoryId ?? null,
                    tagId: action.tagId ?? null,
                    accountId: action.accountId ?? null
                }));

            const categoryAction = isDefined(updateRuleData.categoryId)
                ? [{ type: RuleActionTypeEnum.SET_CATEGORY as const, categoryId: updateRuleData.categoryId, tagId: null, accountId: null }]
                : [];

            const tagActions = updateRuleData.tagIds.map(tagId => ({
                type: RuleActionTypeEnum.ADD_TAG as const,
                categoryId: null,
                tagId,
                accountId: null
            }));

            const mergedActions = [...preservedActions, ...categoryAction, ...tagActions];

            await ruleService.updateById(updateRuleData.ruleId, { actions: mergedActions });

            const result = await ruleEngineService.applyRuleToMatchingTransactions(updateRuleData.ruleId);

            setAppliedCount(result.applied);
            setStatus('success');
            hapticNotification(NotificationFeedbackType.Success);
            setTimeout(onRuleUpdated, SUCCESS_AUTO_DISMISS_MS);
        } catch {
            setStatus('error');
            setTimeout(onDismiss, ERROR_AUTO_DISMISS_MS);
        }
    };

    const handleYesButtonPress = () => void handleYesPress();

    if (status === 'success') {
        return (
            <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(300)}>
                <View className="flex-row items-center gap-xs px-lg py-sm bg-ghost-background rounded-xl shadow-sm">
                    <Icon icon={UserIconNameEnum.CircleCheck} size={CHECK_ICON_SIZE} className="text-positive-foreground" />
                    <Text className="text-xs text-secondary-foreground font-medium">
                        <Trans>Rule updated &middot; Applied to {appliedCount} transactions</Trans>
                    </Text>
                </View>
            </Animated.View>
        );
    }

    if (status === 'error') {
        return (
            <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(300)}>
                <View className="flex-row items-center gap-xs px-lg py-sm bg-ghost-background rounded-xl shadow-sm">
                    <Icon icon={UserIconNameEnum.CircleAlert} size={CHECK_ICON_SIZE} className="text-destructive-foreground" />
                    <Text className="text-xs text-destructive-foreground font-medium">
                        <Trans>Could not update rule</Trans>
                    </Text>
                </View>
            </Animated.View>
        );
    }

    return (
        <GestureDetector gesture={panGesture}>
            <Animated.View style={animatedStyle}>
                <View className="max-w-[85%] flex-row items-center gap-sm px-lg py-sm bg-ghost-background rounded-xl shadow-sm">
                    <Icon icon={UserIconNameEnum.Zap} size={ZAP_ICON_SIZE} className="text-secondary-foreground" />
                    <Text className="text-xs text-secondary-foreground font-medium shrink">{descriptionText}</Text>
                    {status === 'creating' ? (
                        <ActivityIndicator size="small" />
                    ) : (
                        <HapticPressable onPress={handleYesButtonPress} className="px-md py-xs bg-primary-background rounded-lg">
                            <Text className="text-xs text-primary-foreground font-semibold">
                                <Trans>Yes</Trans>
                            </Text>
                        </HapticPressable>
                    )}
                </View>
            </Animated.View>
        </GestureDetector>
    );
};
