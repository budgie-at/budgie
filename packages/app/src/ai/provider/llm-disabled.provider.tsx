import { ReactNode, useMemo } from 'react';

import { LlmContext, LlmContextInterface } from '../context/llm.context';

interface Props {
    readonly children: ReactNode;
}

export const LlmDisabledProvider = ({ children }: Props) => {
    const value = useMemo(
        () =>
            ({
                isAvailable: false,
                llm: { isReady: false, downloadProgress: 0 },
                stt: { isReady: false, downloadProgress: 0 }
            }) as LlmContextInterface,
        []
    );

    return <LlmContext value={value}>{children}</LlmContext>;
};
