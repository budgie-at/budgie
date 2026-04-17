/* eslint-disable max-lines-per-function -- Native lifecycle orchestration: init + AppState effects are colocated for correctness */
import { LlamaContext, initLlama, releaseAllLlama } from 'llama.rn';
import { type RefObject, useEffect, useReducer, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { AiModeEnum } from '../enum/ai-mode.enum';
import { aiModeReducer, getInitialAiState } from '../reducer/ai-mode.reducer';
import {
    BACKGROUND_RELEASE_DELAY_MS,
    CHAT_CONTEXT_SIZE,
    CHAT_DOWNLOAD_WEIGHT,
    CHAT_MODEL_FILENAME,
    CHAT_MODEL_URL,
    EMBEDDING_CONTEXT_SIZE,
    EMBEDDING_DOWNLOAD_WEIGHT,
    EMBEDDING_MODEL_FILENAME,
    EMBEDDING_MODEL_URL,
    GPU_LAYERS
} from '../util/ai-constants.util';
import { downloadModel } from '../util/download-model.util';

interface UseAiLifecycleResultInterface {
    readonly mode: AiModeEnum;
    readonly downloadProgress: number;
    readonly retry: () => void;
    readonly chatContextRef: RefObject<LlamaContext | null>;
    readonly embeddingContextRef: RefObject<LlamaContext | null>;
    readonly modeRef: RefObject<AiModeEnum>;
}

export const useAiLifecycle = (enabled: boolean): UseAiLifecycleResultInterface => {
    const [state, dispatch] = useReducer(aiModeReducer, enabled, getInitialAiState);
    const [downloadProgress, setDownloadProgress] = useState(0);

    const chatContextRef = useRef<LlamaContext | null>(null);
    const embeddingContextRef = useRef<LlamaContext | null>(null);
    const modeRef = useRef<AiModeEnum>(state.mode);
    const releaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingReleaseRef = useRef<Promise<unknown>>(Promise.resolve());

    useEffect(() => {
        modeRef.current = state.mode;
    }, [state.mode]);

    useEffect(() => {
        if (!enabled) {
            return emptyFn;
        }
        if (AppState.currentState !== 'active') {
            dispatch({ type: 'mount-suspended' });

            return emptyFn;
        }

        const cancelledRef = { current: false };
        let chatDl = 0;
        let embedDl = 0;
        const updateDl = (): void => {
            if (!cancelledRef.current) {
                setDownloadProgress(chatDl * CHAT_DOWNLOAD_WEIGHT + embedDl * EMBEDDING_DOWNLOAD_WEIGHT);
            }
        };

        // eslint-disable-next-line max-statements -- Native lifecycle orchestration: sequential await-guarded cancellation paths require multiple statements
        const initialize = async (): Promise<void> => {
            await pendingReleaseRef.current;
            try {
                const [chatPath, embedPath] = await Promise.all([
                    downloadModel(CHAT_MODEL_URL, CHAT_MODEL_FILENAME, progress => {
                        chatDl = progress;
                        updateDl();
                    }),
                    downloadModel(EMBEDDING_MODEL_URL, EMBEDDING_MODEL_FILENAME, progress => {
                        embedDl = progress;
                        updateDl();
                    })
                ]);

                if (cancelledRef.current) {
                    return;
                }

                embeddingContextRef.current = await initLlama({
                    model: embedPath,
                    n_ctx: EMBEDDING_CONTEXT_SIZE,
                    n_gpu_layers: GPU_LAYERS,
                    use_mlock: true,
                    embedding: true,
                    pooling_type: 'mean'
                });

                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- cancelledRef.current can change between awaits via effect cleanup
                if (cancelledRef.current) {
                    // eslint-disable-next-line require-atomic-updates -- Guarded cancellation path: cleanup already nulled refs; we only chain a release for the context just created
                    pendingReleaseRef.current = releaseAllLlama();

                    return;
                }

                chatContextRef.current = await initLlama({
                    model: chatPath,
                    n_ctx: CHAT_CONTEXT_SIZE,
                    n_gpu_layers: GPU_LAYERS,
                    use_mlock: true,
                    embedding: false
                });

                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- cancelledRef.current can change between awaits via effect cleanup
                if (cancelledRef.current) {
                    // eslint-disable-next-line require-atomic-updates -- Guarded cancellation path: cleanup already nulled refs; we only chain a release for the context just created
                    pendingReleaseRef.current = releaseAllLlama();

                    return;
                }

                dispatch({ type: 'init-success' });
            } catch {
                if (!cancelledRef.current) {
                    dispatch({ type: 'init-fail' });
                }
            }
        };

        void initialize();

        return () => {
            cancelledRef.current = true;
            pendingReleaseRef.current = releaseAllLlama();
            chatContextRef.current = null;
            embeddingContextRef.current = null;
        };
    }, [enabled, state.initGeneration]);

    useEffect(() => {
        if (!enabled) {
            return emptyFn;
        }

        const handleChange = (status: AppStateStatus): void => {
            if (status === 'active') {
                if (isDefined(releaseTimerRef.current)) {
                    clearTimeout(releaseTimerRef.current);
                    releaseTimerRef.current = null;
                }
                dispatch({ type: 'resume' });

                return;
            }

            if (isDefined(releaseTimerRef.current)) {
                return;
            }
            releaseTimerRef.current = setTimeout(() => {
                releaseTimerRef.current = null;
                if (modeRef.current === AiModeEnum.Initializing) {
                    dispatch({ type: 'suspend' });
                    chatContextRef.current = null;
                    embeddingContextRef.current = null;

                    return;
                }
                pendingReleaseRef.current = releaseAllLlama();
                chatContextRef.current = null;
                embeddingContextRef.current = null;
                dispatch({ type: 'suspend' });
            }, BACKGROUND_RELEASE_DELAY_MS);
        };

        const subscription = AppState.addEventListener('change', handleChange);

        return () => {
            subscription.remove();
            if (isDefined(releaseTimerRef.current)) {
                clearTimeout(releaseTimerRef.current);
                releaseTimerRef.current = null;
            }
        };
    }, [enabled]);

    const retry = (): void => {
        dispatch({ type: 'retry' });
    };

    return { mode: state.mode, downloadProgress, retry, chatContextRef, embeddingContextRef, modeRef };
};
