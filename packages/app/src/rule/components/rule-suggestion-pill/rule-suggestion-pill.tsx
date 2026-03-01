import { RuleConditionMatchTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { NotificationFeedbackType } from 'expo-haptics/src/Haptics.types';
import { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, cancelAnimation, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { ruleRepository } from '../../../@generic/drizzle/db/db';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { useGetTagByIdsQuery } from '../../../tag/query/use-get-tag-by-ids.query';
import { getTagsDisplayValue } from '../../../transaction/utils/get-tags-display-value.util';
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
const ACTION_ICON_SIZE = 10;
const SPARKLE_ROTATION_DEGREES = 360;

interface Props {
    readonly suggestRuleData: SuggestRuleDataInterface;
    readonly compact?: boolean;
    readonly onRuleCreated: () => void;
}

// eslint-disable-next-line max-statements, max-lines-per-function -- Component with multiple hooks and handlers
export const RuleSuggestionPill = (props: Props) => {
    const { suggestRuleData, compact = false, onRuleCreated } = props;

    const [isSuccess, setIsSuccess] = useState(false);
    const [hapticNotification] = useVibration();
    const [openSuggestRule] = useSuggestRuleModal();
    const { openRuleForm } = useRuleFormModal();

    const categoryId = suggestRuleData.categoryId ?? 0;
    const { category } = useGetCategoryByIdQuery(categoryId);
    const categoryName = category?.title ?? '';

    const { tags } = useGetTagByIdsQuery(suggestRuleData.tagIds);
    const tagDisplayValue = getTagsDisplayValue(tags ?? null);
    const hasCategory = isNotEmptyString(categoryName);
    const hasTagDisplay = isNotEmptyString(tagDisplayValue);

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
            <Icon icon={UserIconNameEnum.ChevronRight} size={ACTION_ICON_SIZE} className="text-secondary-foreground" />
            {hasCategory ? (
                <>
                    <Icon icon={UserIconNameEnum.FolderOpen} size={ACTION_ICON_SIZE} className="text-secondary-foreground" />
                    <Text className="text-xs text-secondary-foreground font-medium max-w-36" numberOfLines={1}>
                        {categoryName}
                    </Text>
                </>
            ) : null}
            {hasTagDisplay ? (
                <>
                    <Icon icon={UserIconNameEnum.Tag} size={ACTION_ICON_SIZE} className="text-secondary-foreground" />
                    <Text className="text-xs text-secondary-foreground font-medium max-w-36" numberOfLines={1}>
                        {tagDisplayValue}
                    </Text>
                </>
            ) : null}
        </HapticPressable>
    );

    const content = isSuccess ? successContent : pillContent;

    if (compact) {
        return <View className="shrink-0">{content}</View>;
    }

    if (isSuccess) {
        return <View className="items-center">{successContent}</View>;
    }

    return (
        <View className="items-center">
            <Animated.View entering={FadeIn.delay(ENTRY_DELAY_MS).duration(200)} exiting={FadeOut.duration(200)}>
                {pillContent}
            </Animated.View>
        </View>
    );
};
