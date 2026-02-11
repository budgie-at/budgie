import { useAiEmbeddingProgressContext } from '../context/ai-embedding-progress.context';

const PROGRESS_THRESHOLD = 90;

interface UseAiEmbeddingProgressReturn {
    readonly progress: number;
    readonly isIncomplete: boolean;
    readonly refreshProgress: () => void;
}

export const useAiEmbeddingProgress = (): UseAiEmbeddingProgressReturn => {
    const { progress, refreshProgress } = useAiEmbeddingProgressContext();

    const isIncomplete = progress < PROGRESS_THRESHOLD;

    return { progress, isIncomplete, refreshProgress };
};
