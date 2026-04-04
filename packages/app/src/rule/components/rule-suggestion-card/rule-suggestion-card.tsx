import {
    RuleActionTypeEnum,
    RuleConditionFieldEnum,
    RuleConditionMatchTypeEnum,
    RuleCreateInputInterface,
    UserIconNameEnum
} from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { NotificationFeedbackType } from 'expo-haptics/src/Haptics.types';
import { useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut, runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { SuggestRuleSelectors } from '../../../@e2e/selectors/suggest-rule.selector';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { ruleRepository } from '../../../@generic/drizzle/db/db';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { useRuleFormModal } from '../../context/rule-form-modal.context';
import { SuggestRuleDataInterface } from '../../interface/suggest-rule-data.interface';
import { ruleEngineService } from '../../service/rule-engine.service';
import { ruleService } from '../../service/rule.service';
import { cleanMerchantTitle } from '../../util/clean-merchant-title.util';
import { findDuplicateRule } from '../../util/find-duplicate-rule.util';
import { selectSuggestCondition } from '../../util/select-suggest-condition.util';

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
    readonly suggestRuleData: SuggestRuleDataInterface;
    readonly onRuleCreated: () => void;
    readonly onDismiss: () => void;
}

const buildDescriptionText = (suggestRuleData: SuggestRuleDataInterface): string => {
    const condition = selectSuggestCondition(suggestRuleData.title, suggestRuleData.mccCode);

    if (!isDefined(condition)) {
        return t`Create a rule for this transaction?`;
    }

    const cleanedTitle = condition.field === RuleConditionFieldEnum.TITLE ? condition.value : cleanMerchantTitle(suggestRuleData.title);
    const displayName = cleanedTitle.length > 0 ? cleanedTitle : condition.value;

    return t`Always categorize \u2018${displayName}\u2019 this way?`;
};

const buildRuleCreateInput = (suggestRuleData: SuggestRuleDataInterface): RuleCreateInputInterface | null => {
    const condition = selectSuggestCondition(suggestRuleData.title, suggestRuleData.mccCode);

    if (!isDefined(condition)) {
        return null;
    }

    const categoryAction = isDefined(suggestRuleData.categoryId)
        ? [{ type: RuleActionTypeEnum.SET_CATEGORY as const, categoryId: suggestRuleData.categoryId, tagId: null, accountId: null }]
        : [];

    const tagActions = suggestRuleData.tagIds.map(tagId => ({
        type: RuleActionTypeEnum.ADD_TAG as const,
        categoryId: null,
        tagId,
        accountId: null
    }));

    return {
        enabled: true,
        conditionMatchType: RuleConditionMatchTypeEnum.ALL,
        conditions: [condition],
        actions: [...categoryAction, ...tagActions],
        applyToExisting: false
    };
};

// eslint-disable-next-line max-lines-per-function, max-statements -- Card component with gesture handling, animations, and multiple render states
export const RuleSuggestionCard = (props: Props) => {
    const { suggestRuleData, onRuleCreated, onDismiss } = props;

    const [status, setStatus] = useState<CardStatus>('idle');
    const [appliedCount, setAppliedCount] = useState(0);
    const [hapticNotification, hapticImpact] = useVibration();
    const { openRuleForm } = useRuleFormModal();

    const translateX = useSharedValue(0);
    const translateY = useSharedValue(ENTRY_TRANSLATE_Y);
    const opacity = useSharedValue(0);

    translateY.value = withSpring(0, ENTRY_SPRING_CONFIG);
    opacity.value = withSpring(1, ENTRY_SPRING_CONFIG);

    const descriptionText = buildDescriptionText(suggestRuleData);

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

    const createRule = async (ruleInput: RuleCreateInputInterface) => {
        setStatus('creating');

        try {
            const rule = await ruleService.create(ruleInput);
            const result = await ruleEngineService.applyRuleToMatchingTransactions(rule.id);

            setAppliedCount(result.applied);
            setStatus('success');
            hapticNotification(NotificationFeedbackType.Success);
            setTimeout(onRuleCreated, SUCCESS_AUTO_DISMISS_MS);
        } catch {
            setStatus('error');
            setTimeout(onDismiss, ERROR_AUTO_DISMISS_MS);
        }
    };

    const handleYesPress = async () => {
        const ruleInput = buildRuleCreateInput(suggestRuleData);

        if (!isDefined(ruleInput)) {
            setStatus('error');
            setTimeout(onDismiss, ERROR_AUTO_DISMISS_MS);

            return;
        }

        const existingRules = await ruleRepository.findAllWithActionsAndCategories();
        const duplicateRule = findDuplicateRule(ruleInput.conditions, ruleInput.conditionMatchType, existingRules);

        if (isDefined(duplicateRule)) {
            Alert.alert(t`Duplicate rule`, t`A rule with the same conditions already exists.`, [
                { text: t`Cancel`, style: 'cancel' },
                { text: t`Edit existing`, onPress: () => void openRuleForm({ ruleId: duplicateRule.id }) },
                { text: t`Create anyway`, onPress: () => void createRule(ruleInput) }
            ]);

            return;
        }

        await createRule(ruleInput);
    };

    const handleYesButtonPress = () => void handleYesPress();

    if (status === 'success') {
        return (
            <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(300)}>
                <View className="flex-row items-center gap-xs px-lg py-sm bg-ghost-background rounded-xl shadow-sm">
                    <Icon icon={UserIconNameEnum.CircleCheck} size={CHECK_ICON_SIZE} className="text-positive-foreground" />
                    <Text className="text-xs text-secondary-foreground font-medium">
                        <Trans>Rule created &middot; Applied to {appliedCount} transactions</Trans>
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
                        <Trans>Could not create rule</Trans>
                    </Text>
                </View>
            </Animated.View>
        );
    }

    return (
        <GestureDetector gesture={panGesture}>
            <Animated.View style={animatedStyle}>
                <View
                    testID={SuggestRuleSelectors.Card}
                    className="flex-row items-center gap-sm px-lg py-sm bg-ghost-background rounded-xl shadow-sm"
                >
                    <Icon icon={UserIconNameEnum.Zap} size={ZAP_ICON_SIZE} className="text-secondary-foreground" />
                    <Text className="text-xs text-secondary-foreground font-medium shrink">{descriptionText}</Text>
                    {status === 'creating' ? (
                        <ActivityIndicator size="small" />
                    ) : (
                        <HapticPressable
                            testID={SuggestRuleSelectors.CreateRuleButton}
                            onPress={handleYesButtonPress}
                            className="px-md py-xs bg-primary-background rounded-lg"
                        >
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
