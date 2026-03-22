import { ReactNode } from 'react';

import { LlmContext } from '../context/llm.context';
import { useLlamaLlm } from '../hook/use-llama-llm.hook';
import { useWhisperStt } from '../hook/use-whisper-stt.hook';

interface Props {
    readonly children: ReactNode;
}

export const LlmProvider = ({ children }: Props) => {
    const llm = useLlamaLlm();
    const stt = useWhisperStt();
    const value = { isAvailable: true, llm, stt };

    return <LlmContext value={value}>{children}</LlmContext>;
};
