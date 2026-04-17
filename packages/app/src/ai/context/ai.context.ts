/* eslint-disable lingui/no-unlocalized-strings */
import { createContext, use } from 'react';

import { isDefined } from '@rnw-community/shared';

import { AiContextInterface } from '../interface/ai-context.interface';

export const AiContext = createContext<AiContextInterface | null>(null);

export const useAiContext = (): AiContextInterface => {
    const context = use(AiContext);

    if (!isDefined(context)) {
        throw new Error('useAiContext must be used within AiProvider');
    }

    return context;
};
