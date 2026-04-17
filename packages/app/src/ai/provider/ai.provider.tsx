/* eslint-disable lingui/no-unlocalized-strings, max-lines-per-function, max-statements, max-lines -- Unified AI provider owns entire lifecycle */
import { GenerateOptionsInterface, LlmInterface } from '@budgie/ai';
import { LlamaContext, initLlama, releaseAllLlama } from 'llama.rn';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { WHISPER_SMALL, useSpeechToText } from 'react-native-executorch';

import { emptyFn, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { transactionEmbeddingRepository, transactionRepository } from '../../@generic/drizzle/db/db';
import { isAiEnabled } from '../../@generic/utils/is-ai-enabled.util';
import { AiProgressContext } from '../context/ai-progress.context';
import { AiContext } from '../context/ai.context';
import { AiModeEnum } from '../enum/ai-mode.enum';
import { embeddingDrainerService } from '../service/embedding-drainer.service';
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
import { runCompletion } from '../util/run-completion.util';
import { isNativeCallSafe } from '../utils/is-native-call-safe.util';

interface Props {
    readonly children: ReactNode;
}

export const AiProvider = ({ children }: Props) => {
    const enabled = isAiEnabled();

    const [mode, setMode] = useState<AiModeEnum>(enabled ? AiModeEnum.Initializing : AiModeEnum.Disabled);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isEmbedding, setIsEmbedding] = useState(false);
    const [initGeneration, setInitGeneration] = useState(0);
    const [progressVersion, setProgressVersion] = useState(0);

    const stt = useSpeechToText({ model: WHISPER_SMALL });

    const chatContextRef = useRef<LlamaContext | null>(null);
    const embeddingContextRef = useRef<LlamaContext | null>(null);
    const modeRef = useRef<AiModeEnum>(mode);
    const releaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const generateMutexRef = useRef<Promise<unknown>>(Promise.resolve());
    const pendingReleaseRef = useRef<Promise<unknown>>(Promise.resolve());

    const transition = (next: AiModeEnum): void => {
        setMode(prev => {
            if (prev === next) {
                return prev;
            }
            modeRef.current = next;

            return next;
        });
    };

    const refreshProgress = (): void => {
        setProgressVersion(version => version + 1);
    };

    useEffect(() => {
        let cancelled = false;
        const load = async (): Promise<void> => {
            try {
                const total = await transactionRepository.countAllActive();
                const pending = await transactionEmbeddingRepository.countPending();
                if (!cancelled) {
                    const percent = total === 0 ? 100 : Math.round(((total - pending) / total) * 100);
                    setProgress(percent);
                    setIsEmbedding(pending > 0);
                }
            } catch {
                emptyFn();
            }
        };
        void load();

        return () => {
            cancelled = true;
        };
    }, [progressVersion]);

    useEffect(() => {
        if (!enabled) {
            return emptyFn;
        }
        if (AppState.currentState !== 'active') {
            transition(AiModeEnum.Suspended);

            return emptyFn;
        }

        const cancelledRef: { current: boolean } = { current: false };
        let chatDl = 0;
        let embedDl = 0;
        const updateDl = (): void => {
            if (!cancelledRef.current) {
                setDownloadProgress(chatDl * CHAT_DOWNLOAD_WEIGHT + embedDl * EMBEDDING_DOWNLOAD_WEIGHT);
            }
        };

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

                transition(AiModeEnum.Ready);
            } catch {
                if (!cancelledRef.current) {
                    transition(AiModeEnum.Error);
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
    }, [enabled, initGeneration]);

    useEffect(() => {
        if (!enabled) {
            return emptyFn;
        }

        const handleChange = (state: AppStateStatus): void => {
            if (state === 'active') {
                if (releaseTimerRef.current !== null) {
                    clearTimeout(releaseTimerRef.current);
                    releaseTimerRef.current = null;
                }
                if (modeRef.current === AiModeEnum.Suspended) {
                    transition(AiModeEnum.Initializing);
                    setInitGeneration(generation => generation + 1);
                }

                return;
            }

            if (releaseTimerRef.current !== null) {
                return;
            }
            releaseTimerRef.current = setTimeout(() => {
                releaseTimerRef.current = null;
                if (modeRef.current === AiModeEnum.Initializing) {
                    // Init is in flight — let it finish; it will clean up on cleanup.
                    transition(AiModeEnum.Suspended);
                    chatContextRef.current = null;
                    embeddingContextRef.current = null;

                    return;
                }
                pendingReleaseRef.current = releaseAllLlama();
                chatContextRef.current = null;
                embeddingContextRef.current = null;
                transition(AiModeEnum.Suspended);
            }, BACKGROUND_RELEASE_DELAY_MS);
        };

        const subscription = AppState.addEventListener('change', handleChange);

        return () => {
            subscription.remove();
            if (releaseTimerRef.current !== null) {
                clearTimeout(releaseTimerRef.current);
                releaseTimerRef.current = null;
            }
        };
    }, [enabled]);

    const retry = (): void => {
        transition(AiModeEnum.Initializing);
        setInitGeneration(generation => generation + 1);
    };

    const generate = async (systemPrompt: string, userMessage: string, options?: GenerateOptionsInterface): Promise<string> => {
        if (!isNativeCallSafe(modeRef.current)) {
            throw new Error('AI not ready or app not active');
        }
        if (!isDefined(chatContextRef.current)) {
            throw new Error('Model not loaded');
        }

        const previous = generateMutexRef.current;
        const current = previous.then(
            async () => {
                if (!isDefined(chatContextRef.current)) {
                    throw new Error('Model released');
                }

                return runCompletion(chatContextRef.current, systemPrompt, userMessage, options);
            },
            async () => {
                if (!isDefined(chatContextRef.current)) {
                    throw new Error('Model released');
                }

                return runCompletion(chatContextRef.current, systemPrompt, userMessage, options);
            }
        );
        generateMutexRef.current = current.catch(() => void emptyFn());

        return current;
    };

    const embedding = async (text: string): Promise<number[]> => {
        if (!isNativeCallSafe(modeRef.current)) {
            return [];
        }
        if (!isDefined(embeddingContextRef.current)) {
            return [];
        }
        try {
            const result = await embeddingContextRef.current.embedding(text);

            return result.embedding;
        } catch {
            return [];
        }
    };

    const batchEmbedding = async (texts: string[]): Promise<Map<string, number[]>> => {
        if (!isNativeCallSafe(modeRef.current)) {
            return new Map();
        }
        const context = embeddingContextRef.current;
        if (!isDefined(context) || !isNotEmptyArray(texts)) {
            return new Map();
        }

        const results = new Map<string, number[]>();
        /* eslint-disable no-await-in-loop -- Sequential batch embedding */
        for (const text of texts) {
            if (!isNativeCallSafe(modeRef.current)) {
                break;
            }
            try {
                const result = await context.embedding(text);
                if (isNotEmptyArray(result.embedding)) {
                    results.set(text, result.embedding);
                }
            } catch {
                emptyFn();
            }
        }
        /* eslint-enable no-await-in-loop */

        return results;
    };

    const interrupt = (): void => {
        void chatContextRef.current?.stopCompletion();
    };

    useEffect(() => {
        if (!enabled) {
            return emptyFn;
        }
        if (mode !== AiModeEnum.Ready) {
            embeddingDrainerService.stop();

            return emptyFn;
        }
        embeddingDrainerService.start({
            getMode: () => modeRef.current,
            embed: embedding,
            refreshProgress
        });

        return () => {
            embeddingDrainerService.stop();
        };
    }, [enabled, mode]);

    const llm: LlmInterface = {
        isReady: mode === AiModeEnum.Ready,
        isEmbeddingReady: mode === AiModeEnum.Ready,
        isInitializing: mode === AiModeEnum.Initializing,
        isGenerating: false,
        downloadProgress: 0,
        error: null,
        generate,
        embedding,
        batchEmbedding,
        interrupt
    };

    const value = { mode, llm, stt, retry };
    const progressValue = { progress, isEmbedding, downloadProgress, refreshProgress };

    return (
        <AiContext value={value}>
            <AiProgressContext value={progressValue}>{children}</AiProgressContext>
        </AiContext>
    );
};
