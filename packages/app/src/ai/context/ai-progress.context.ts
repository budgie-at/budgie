/* eslint-disable lingui/no-unlocalized-strings */
import { createContext, use } from 'react';

import { isDefined } from '@rnw-community/shared';

import { AiProgressContextInterface } from '../interface/ai-progress-context.interface';

export const AiProgressContext = createContext<AiProgressContextInterface | null>(null);

export const useAiProgressContext = (): AiProgressContextInterface => {
    const context = use(AiProgressContext);

    if (!isDefined(context)) {
        throw new Error('useAiProgressContext must be used within AiProvider');
    }

    return context;
};
