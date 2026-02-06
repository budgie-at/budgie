/* eslint-disable lingui/no-unlocalized-strings */
import { ReactNode } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { LlmContext, LlmContextInterface, LlmInterface } from '../context/llm.context';

interface Props {
    readonly children: ReactNode;
}

const disabledLlm: LlmInterface = {
    isReady: false,
    isInitializing: false,
    isGenerating: false,
    downloadProgress: 0,
    error: null,
    generate: () => Promise.reject(new Error('AI is disabled')),
    embedding: () => Promise.resolve([]),
    interrupt: emptyFn
};

const disabledValue = {
    isAvailable: false,
    llm: disabledLlm,
    stt: { isReady: false, downloadProgress: 0 }
} as LlmContextInterface;

export const LlmDisabledProvider = ({ children }: Props) => <LlmContext value={disabledValue}>{children}</LlmContext>;
