import { type PropsWithChildren, Suspense, lazy, useState } from 'react';

import { VoiceInputContext } from '../context/voice-input.context';
import { useAiAvailable } from '../hook/use-ai-available.hook';

const LazyVoiceInputOverlay = lazy(async () => {
    const { VoiceInputOverlay } = await import('../component/voice-input-overlay/voice-input-overlay');

    return { default: VoiceInputOverlay };
});

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
