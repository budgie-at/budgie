import { ReactNode, useEffect, useMemo, useState } from 'react';
import { LLAMA3_2_1B_QLORA, SpeechToTextModule, WHISPER_BASE, useLLM } from 'react-native-executorch';

import { LlmContext } from '../context/llm.context';

interface Props {
    readonly children: ReactNode;
}

const speechToTextModule = new SpeechToTextModule();

export const LlmProvider = ({ children }: Props) => {
    const llm = useLLM({ model: LLAMA3_2_1B_QLORA });

    const [sttDownloadProgress, setSttDownloadProgress] = useState(0);
    const [isSttReady, setIsSttReady] = useState(false);

    useEffect(() => {
        void speechToTextModule.load(WHISPER_BASE, progress => {
            setSttDownloadProgress(progress);
            setIsSttReady(progress >= 1);
        });
    }, []);

    const value = useMemo(
        () => ({ llm, speechToTextModule, sttDownloadProgress, isSttReady }),
        [llm, sttDownloadProgress, isSttReady]
    );

    return <LlmContext.Provider value={value}>{children}</LlmContext.Provider>;
};
