import { UserIconNameEnum } from '@budgie/contracts';
import { View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { AiBrainProgress } from '../../../ai/component/ai-brain-progress/ai-brain-progress';
import { useAiEmbeddingProgress } from '../../../ai/hook/use-ai-embedding-progress.hook';

interface Props {
    readonly isLoading?: boolean;
    readonly showArrow?: boolean;
}

const BRAIN_CONTAINER_SIZE = 20;
const BRAIN_ICON_SIZE = 12;

export const SuggestionLoadingIndicator = ({ isLoading = false, showArrow = true }: Props) => {
    const { progress, isIncomplete } = useAiEmbeddingProgress();

    const shouldAnimate = isLoading || isIncomplete;

    return (
        <View className="flex-row items-center gap-xs pl-sm pr-[4%] shrink-0">
            {showArrow ? <Icon icon={UserIconNameEnum.ArrowLeft} size={12} className="text-secondary-foreground" /> : null}
            <AiBrainProgress progress={progress} size={BRAIN_CONTAINER_SIZE} iconSize={BRAIN_ICON_SIZE} isAnimating={shouldAnimate} />
        </View>
    );
};
