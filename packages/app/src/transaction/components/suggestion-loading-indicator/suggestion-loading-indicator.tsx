import { UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { AiBrainProgress } from '../../../ai/component/ai-brain-progress/ai-brain-progress';
import { AiSubsystemStatusEnum } from '../../../ai/enum/ai-subsystem-status.enum';
import { useEmbeddingProgress } from '../../../ai/hook/use-embedding-progress.hook';
import { useEmbedding } from '../../../ai/hook/use-embedding.hook';

interface Props {
    readonly isLoading?: boolean;
    readonly showArrow?: boolean;
}

const BRAIN_CONTAINER_SIZE = 26;
const BRAIN_ICON_SIZE = 16;

export const SuggestionLoadingIndicator = ({ isLoading = false, showArrow = true }: Props) => {
    const router = useRouter();
    const { status: embeddingStatus } = useEmbedding();
    const { progress, isEmbedding } = useEmbeddingProgress();
    const isEmbeddingInitializing =
        embeddingStatus === AiSubsystemStatusEnum.Initializing || embeddingStatus === AiSubsystemStatusEnum.Downloading;
    const statusLabel = isEmbeddingInitializing ? t`Loading AI model...` : '';

    const shouldAnimate = isLoading || isEmbedding;
    const showHint = !showArrow;

    const handleBrainPress = () => void router.push({ pathname: '/settings', params: { anchor: 'ai' } });

    return (
        <View className="flex-row items-center gap-xs pl-sm pr-[4%] shrink-0">
            {showHint ? (
                <Pressable className="flex-row items-center gap-xs" onPress={handleBrainPress} hitSlop={8}>
                    <Text className="text-xs text-secondary-foreground" numberOfLines={1}>
                        {statusLabel}
                    </Text>
                    <AiBrainProgress
                        progress={progress}
                        size={BRAIN_CONTAINER_SIZE}
                        iconSize={BRAIN_ICON_SIZE}
                        isAnimating={shouldAnimate}
                    />
                </Pressable>
            ) : (
                <>
                    <Icon icon={UserIconNameEnum.ArrowLeft} size={12} className="text-secondary-foreground" />
                    <AiBrainProgress
                        progress={progress}
                        size={BRAIN_CONTAINER_SIZE}
                        iconSize={BRAIN_ICON_SIZE}
                        isAnimating={shouldAnimate}
                    />
                </>
            )}
        </View>
    );
};
