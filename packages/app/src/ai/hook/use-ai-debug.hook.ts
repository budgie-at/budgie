import { useEffect, useState } from 'react';

import { AiDebugEventInterface } from '../interface/ai-debug-event.interface';
import { aiDebugBuffer } from '../utils/ai-debug-buffer.util';

export const useAiDebug = (): readonly AiDebugEventInterface[] => {
    const [events, setEvents] = useState<readonly AiDebugEventInterface[]>(aiDebugBuffer.snapshot());

    useEffect(() => aiDebugBuffer.subscribe(() => {
            setEvents(aiDebugBuffer.snapshot());
        }), []);

    return events;
};
