import { UserIconNameEnum } from '@budgie/contracts';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { AiBrainProgress } from '../../../ai/component/ai-brain-progress/ai-brain-progress';
import { useAiStatusContext } from '../../../ai/context/ai-status.context';
import { useAiEmbeddingProgress } from '../../../ai/hook/use-ai-embedding-progress.hook';

interface Props {
    readonly isLoading?: boolean;
    readonly showArrow?: boolean;
}

const BRAIN_CONTAINER_SIZE = 26;
const BRAIN_ICON_SIZE = 16;

export const SuggestionLoadingIndicator = ({ isLoading = false, showArrow = true }: Props) => {
    const router = useRouter();
    const { progress, isEmbedding } = useAiEmbeddingProgress();
    const { statusLabel } = useAiStatusContext();

    const shouldAnimate = isLoading || isEmbedding;
    const showHint = !showArrow;

    const handleBrainPress = () => void router.push({ pathname: '/settings', params: { scrollTo: 'ai' } });

    return (
        <View className="flex-row items-center gap-xs pl-sm pr-[4%] shrink-0">
            {showArrow ? (
                <Icon icon={UserIconNameEnum.ArrowLeft} size={12} className="text-secondary-foreground" />
            ) : (
                <Text className="text-xs text-secondary-foreground" numberOfLines={1}>
                    {statusLabel}
                </Text>
            )}
            {showHint ? (
                <Pressable onPress={handleBrainPress} hitSlop={8}>
                    <AiBrainProgress
                        progress={progress}
                        size={BRAIN_CONTAINER_SIZE}
                        iconSize={BRAIN_ICON_SIZE}
                        isAnimating={shouldAnimate}
                    />
                </Pressable>
            ) : (
                <AiBrainProgress progress={progress} size={BRAIN_CONTAINER_SIZE} iconSize={BRAIN_ICON_SIZE} isAnimating={shouldAnimate} />
            )}
        </View>
    );
};
