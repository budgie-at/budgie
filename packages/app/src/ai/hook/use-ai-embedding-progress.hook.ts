import { useAiEmbeddingProgressContext } from '../context/ai-embedding-progress.context';

const PROGRESS_THRESHOLD = 90;

interface UseAiEmbeddingProgressReturn {
    readonly progress: number;
    readonly isIncomplete: boolean;
    readonly isEmbedding: boolean;
    readonly refreshProgress: () => void;
    readonly setIsEmbedding: (value: boolean) => void;
}

export const useAiEmbeddingProgress = (): UseAiEmbeddingProgressReturn => {
    const { progress, isEmbedding, refreshProgress, setIsEmbedding } = useAiEmbeddingProgressContext();

    const isIncomplete = progress < PROGRESS_THRESHOLD;

    return { progress, isIncomplete, isEmbedding, refreshProgress, setIsEmbedding };
};
