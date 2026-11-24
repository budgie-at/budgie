import { useAtomValue } from '@effect/atom-react/Hooks';
import { type PropsWithChildren, Suspense, useState } from 'react';

import { LazyVoiceInputOverlay } from '../component/lazy-voice-input-overlay/lazy-voice-input-overlay';
import { aiCoordinatorSnapshotAtom } from '../constant/ai-snapshot-atoms.constant';
import { VoiceInputActionsContext, VoiceInputOpenContext } from '../context/voice-input.context';

export const VoiceInputProvider = ({ children }: PropsWithChildren) => {
    const isAiAvailable = useAtomValue(aiCoordinatorSnapshotAtom, snapshot => snapshot.isAvailable);
    const [isOpen, setIsOpen] = useState(false);
    const [actions] = useState(() => ({
        open: () => void setIsOpen(true),
        close: () => void setIsOpen(false)
    }));

    const showOverlay = isAiAvailable && isOpen;

    return (
        <VoiceInputActionsContext value={actions}>
            <VoiceInputOpenContext value={isOpen}>
                {children}
                {showOverlay ? (
                    <Suspense fallback={null}>
                        <LazyVoiceInputOverlay onClose={actions.close} />
                    </Suspense>
                ) : null}
            </VoiceInputOpenContext>
        </VoiceInputActionsContext>
    );
};
