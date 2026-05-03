import { type PropsWithChildren, Suspense, useState } from 'react';

import { LazyVoiceInputOverlay } from '../component/lazy-voice-input-overlay/lazy-voice-input-overlay';
import { VoiceInputContext } from '../context/voice-input.context';
import { useAiAvailable } from '../hook/use-ai-available.hook';

export const VoiceInputProvider = ({ children }: PropsWithChildren) => {
    const isAiAvailable = useAiAvailable();
    const [isOpen, setIsOpen] = useState(false);

    const handleOpen = () => void setIsOpen(true);
    const handleClose = () => void setIsOpen(false);

    const value = { isOpen, open: handleOpen, close: handleClose };
    const showOverlay = isAiAvailable && isOpen;

    return (
        <VoiceInputContext value={value}>
            {children}
            {showOverlay ? (
                <Suspense fallback={null}>
                    <LazyVoiceInputOverlay onClose={handleClose} />
                </Suspense>
            ) : null}
        </VoiceInputContext>
    );
};
