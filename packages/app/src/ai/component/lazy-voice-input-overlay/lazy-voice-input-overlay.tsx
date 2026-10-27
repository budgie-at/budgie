import { lazy } from 'react';

export const LazyVoiceInputOverlay = lazy(() =>
    import('../voice-input-overlay/voice-input-overlay').then(module => ({ default: module.VoiceInputOverlay }))
);
