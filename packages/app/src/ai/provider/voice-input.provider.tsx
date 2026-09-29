import { useAtomValue } from '@effect/atom-react/Hooks';
import { type PropsWithChildren, Suspense, useState } from 'react';

import { LazyVoiceInputOverlay } from '../component/lazy-voice-input-overlay/lazy-voice-input-overlay';
import { VoiceInputContext } from '../context/voice-input.context';
import { aiCoordinatorService } from '../service/ai-coordinator.service';

export const VoiceInputProvider = ({ children }: PropsWithChildren) => {
    const isAiAvailable = useAtomValue(aiCoordinatorService.snapshot, snapshot => snapshot.isAvailable);
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
