/* eslint-disable lingui/no-unlocalized-strings */
import { LlmInterface } from '@budgie/ai';
import { ReactNode } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { LlmContext, LlmContextInterface } from '../context/llm.context';

interface Props {
    readonly children: ReactNode;
}

const disabledLlm: LlmInterface = {
    isReady: false,
    isEmbeddingReady: false,
    isInitializing: false,
    isGenerating: false,
    downloadProgress: 0,
    error: null,
    generate: () => Promise.reject(new Error('AI is disabled')),
    embedding: () => Promise.resolve([]),
    batchEmbedding: () => Promise.resolve(new Map()),
    interrupt: emptyFn
};

const disabledValue = {
    isAvailable: false,
    llm: disabledLlm,
    stt: { isReady: false, downloadProgress: 0 }
} as LlmContextInterface;

export const LlmDisabledProvider = ({ children }: Props) => <LlmContext value={disabledValue}>{children}</LlmContext>;
