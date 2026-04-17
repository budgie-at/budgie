import { LlmInterface } from '@budgie/ai';
import { ReactNode, useEffect } from 'react';
import { WHISPER_SMALL, useSpeechToText } from 'react-native-executorch';

import { emptyFn } from '@rnw-community/shared';

import { isAiEnabled } from '../../@generic/utils/is-ai-enabled.util';
import { AiProgressContext } from '../context/ai-progress.context';
import { AiContext } from '../context/ai.context';
import { AiModeEnum } from '../enum/ai-mode.enum';
import { useAiChat } from '../hook/use-ai-chat.hook';
import { useAiEmbedding } from '../hook/use-ai-embedding.hook';
import { useAiLifecycle } from '../hook/use-ai-lifecycle.hook';
import { embeddingDrainerService } from '../service/embedding-drainer.service';

interface Props {
    readonly children: ReactNode;
}

export const AiProvider = ({ children }: Props) => {
    const enabled = isAiEnabled();

    const { mode, downloadProgress, retry, chatContextRef, embeddingContextRef, modeRef } = useAiLifecycle(enabled);
    const { generate, interrupt } = useAiChat({ chatContextRef, modeRef });
    const { embedding, batchEmbedding } = useAiEmbedding({ embeddingContextRef, modeRef });
    const stt = useSpeechToText({ model: WHISPER_SMALL });

    useEffect(
        () => {
            if (!enabled || mode !== AiModeEnum.Ready) {
                embeddingDrainerService.stop();

                return emptyFn;
            }
            embeddingDrainerService.start(() => modeRef.current, embedding);

            return () => {
                embeddingDrainerService.stop();
            };
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps -- embedding and modeRef are stable; drainer restarts only on mode transitions
        [enabled, mode]
    );

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

    const value = { mode, isAvailable: mode !== AiModeEnum.Disabled, llm, stt, retry };
    const progressValue = { downloadProgress };

    return (
        <AiContext value={value}>
            <AiProgressContext value={progressValue}>{children}</AiProgressContext>
        </AiContext>
    );
};
