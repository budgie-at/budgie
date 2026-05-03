import { lazy } from 'react';

export const LazyVoiceInputOverlay = lazy(async () => {
    const { VoiceInputOverlay } = await import('../voice-input-overlay/voice-input-overlay');

    return { default: VoiceInputOverlay };
});
