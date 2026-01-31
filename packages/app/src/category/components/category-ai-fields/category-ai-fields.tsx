import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Button } from '../../../@generic/component/button/button';
import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly titleEn: string | null;
    readonly titleTags: string | null;
    readonly isRegenerating: boolean;
    readonly onRegenerate: () => void;
    readonly animationDelay?: number;
}

const FIELD_DELAY_OFFSET = 100;
const DEFAULT_ANIMATION_DELAY = 200;

export const CategoryAiFields = (props: Props) => {
    const { titleEn, titleTags, isRegenerating, onRegenerate, animationDelay = DEFAULT_ANIMATION_DELAY } = props;
    const { t } = useLingui();

    const englishValue = titleEn ?? t`Not generated`;
    const tagsValue = titleTags ?? t`Not generated`;
    const buttonContent = isRegenerating ? t`Generating...` : t`Regenerate`;

    const englishDelay = animationDelay;
    const tagsDelay = animationDelay + FIELD_DELAY_OFFSET;
    const buttonDelay = animationDelay + FIELD_DELAY_OFFSET * 2;

    return (
        <View className="px-3xl pt-xl">
            <View className="bg-secondary-background rounded-2xl border border-secondary-corner overflow-hidden">
                <View className="flex-row items-center px-xl py-md border-b border-secondary-corner">
                    <Icon icon={UserIconNameEnum.Sparkles} size={14} className="text-secondary-foreground" />
                    <Text className="text-xs text-secondary-foreground ml-sm uppercase font-medium">
                        <Trans>AI-Generated Metadata</Trans>
                    </Text>
                </View>

                {/* jscpd:ignore-start -- Intentionally similar field rows with different icons/labels */}
                <Animated.View
                    entering={FadeInUp.delay(englishDelay).duration(DEFAULT_ANIMATION_DELAY)}
                    className="flex-row items-center px-xl py-lg border-b border-secondary-corner"
                >
                    <Icon icon={UserIconNameEnum.Globe} size={18} className="text-secondary-foreground" />
                    <View className="ml-lg flex-1">
                        <Text className="text-xxs text-secondary-foreground uppercase">
                            <Trans>English Translation</Trans>
                        </Text>
                        <Text className="text-sm text-primary font-medium" numberOfLines={1}>
                            {englishValue}
                        </Text>
                    </View>
                </Animated.View>

                <Animated.View
                    entering={FadeInUp.delay(tagsDelay).duration(DEFAULT_ANIMATION_DELAY)}
                    className="flex-row px-xl py-lg"
                >
                    <Icon icon={UserIconNameEnum.Tag} size={18} className="text-secondary-foreground mt-xs" />
                    <View className="ml-lg flex-1">
                        <Text className="text-xxs text-secondary-foreground uppercase">
                            <Trans>Search Keywords</Trans>
                        </Text>
                        <Text className="text-sm text-primary font-medium">
                            {tagsValue}
                        </Text>
                    </View>
                </Animated.View>
                {/* jscpd:ignore-end */}
            </View>

            <Animated.View entering={FadeInUp.delay(buttonDelay).duration(DEFAULT_ANIMATION_DELAY)} className="items-center pt-lg">
                <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={UserIconNameEnum.RefreshCw}
                    onPress={onRegenerate}
                    disabled={isRegenerating}
                    content={buttonContent}
                />
            </Animated.View>
        </View>
    );
};
