import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

interface VoiceInputContextInterface {
    isOpen: boolean;
    open: () => void;
    close: () => void;
}

export const VoiceInputContext = createContext<VoiceInputContextInterface>({
    isOpen: false,
    open: emptyFn,
    close: emptyFn
});

export const useVoiceInputContext = () => use(VoiceInputContext);
