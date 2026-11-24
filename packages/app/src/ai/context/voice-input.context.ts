import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

import type { VoiceInputActionsContextInterface } from '../interface/voice-input-actions-context.interface';

export const VoiceInputOpenContext = createContext(false);

export const VoiceInputActionsContext = createContext<VoiceInputActionsContextInterface>({
    open: emptyFn,
    close: emptyFn
});

export const useVoiceInputOpen = () => use(VoiceInputOpenContext);

export const useVoiceInputActions = () => use(VoiceInputActionsContext);
