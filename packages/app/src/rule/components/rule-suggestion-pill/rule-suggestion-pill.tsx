import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { NotificationFeedbackType } from 'expo-haptics/src/Haptics.types';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, cancelAnimation, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { isNotEmptyString } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { useGetTagByIdsQuery } from '../../../tag/query/use-get-tag-by-ids.query';
import { getTagsDisplayValue } from '../../../transaction/utils/get-tags-display-value.util';
import { useSuggestRuleModal } from '../../context/suggest-rule-modal.context';
import { SuggestRuleDataInterface } from '../../interface/suggest-rule-data.interface';

const ENTRY_DELAY_MS = 500;
const SPARKLE_ANIMATION_DURATION = 600;
const SUCCESS_EXIT_DELAY_MS = 600;
const SPARKLE_ICON_SIZE = 16;
const CHECK_ICON_SIZE = 16;
const ACTION_ICON_SIZE = 12;
const SPARKLE_ROTATION_DEGREES = 360;

interface Props {
    readonly suggestRuleData: SuggestRuleDataInterface;
    readonly onRuleCreated: () => void;
}

// eslint-disable-next-line max-statements -- Component with multiple hooks and handlers
export const RuleSuggestionPill = (props: Props) => {
    const { suggestRuleData, onRuleCreated } = props;

    const [isSuccess, setIsSuccess] = useState(false);
    const [hapticNotification] = useVibration();
    const { openSuggestRule } = useSuggestRuleModal();

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

    const handlePress = async () => {
        const result = await openSuggestRule({ suggestRuleData });

        if (result === 'created') {
            setIsSuccess(true);
            hapticNotification(NotificationFeedbackType.Success);
            onRuleCreated();
        }
    };

    const handlePillPress = () => void handlePress();

    if (isSuccess) {
        return (
            <View className="items-center">
                <Animated.View
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.delay(SUCCESS_EXIT_DELAY_MS).duration(300)}
                    className="flex-row items-center gap-sm px-xl py-md bg-ghost-background rounded-xl shadow-sm"
                >
                    <Icon icon={UserIconNameEnum.CircleCheck} size={CHECK_ICON_SIZE} className="text-secondary-foreground" />
                    <Text className="text-sm text-secondary-foreground font-medium">
                        <Trans>Rule created</Trans>
                    </Text>
                </Animated.View>
            </View>
        );
    }

    return (
        <View className="items-center">
            <Animated.View entering={FadeIn.delay(ENTRY_DELAY_MS).duration(200)} exiting={FadeOut.duration(200)}>
                <HapticPressable
                    onPress={handlePillPress}
                    className="flex-row items-center gap-sm px-xl py-md bg-ghost-background rounded-xl shadow-sm"
                >
                    <Animated.View style={sparkleAnimatedStyle}>
                        <Icon icon={UserIconNameEnum.Sparkles} size={SPARKLE_ICON_SIZE} className="text-secondary-foreground" />
                    </Animated.View>
                    {hasCategory ? (
                        <>
                            <Icon icon={UserIconNameEnum.FolderOpen} size={ACTION_ICON_SIZE} className="text-secondary-foreground" />
                            <Text className="text-sm text-secondary-foreground font-medium max-w-24" numberOfLines={1}>
                                {categoryName}
                            </Text>
                        </>
                    ) : null}
                    {hasTagDisplay ? (
                        <>
                            <Icon icon={UserIconNameEnum.Tag} size={ACTION_ICON_SIZE} className="text-secondary-foreground" />
                            <Text className="text-sm text-secondary-foreground font-medium max-w-24" numberOfLines={1}>
                                {tagDisplayValue}
                            </Text>
                        </>
                    ) : null}
                </HapticPressable>
            </Animated.View>
        </View>
    );
};
