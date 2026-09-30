import { useAtomValue } from '@effect/atom-react/Hooks';
import { type PropsWithChildren, Suspense, useState } from 'react';

import { LazyVoiceInputOverlay } from '../component/lazy-voice-input-overlay/lazy-voice-input-overlay';
import { aiCoordinatorSnapshotAtom } from '../constant/ai-snapshot-atoms.constant';
import { VoiceInputContext } from '../context/voice-input.context';

export const VoiceInputProvider = ({ children }: PropsWithChildren) => {
    const isAiAvailable = useAtomValue(aiCoordinatorSnapshotAtom, snapshot => snapshot.isAvailable);
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
