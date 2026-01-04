import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { useLLM } from 'react-native-executorch';

import { isNotEmptyString } from '@rnw-community/shared';

interface UseLlmGenerationReturn {
    generateFromTranscription: (transcribed: string) => Promise<void>;
    error: string;
    clearError: () => void;
}

export const useLlmGeneration = (llm: ReturnType<typeof useLLM>, systemPrompt: string): UseLlmGenerationReturn => {
    const { t } = useLingui();
    const [error, setError] = useState('');

    const generateFromTranscription = async (transcribed: string) => {
        setError('');

        if (!isNotEmptyString(transcribed)) {
            setError(t`No speech detected`);

            return;
        }

        try {
            await llm.generate([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: transcribed }
            ]);
        } catch (e: unknown) {
            if (llm.isGenerating) {
                return;
            }

            setError(e instanceof Error ? e.message : String(e));
        }
    };

    const clearError = () => void setError('');

    return { generateFromTranscription, error, clearError };
};
