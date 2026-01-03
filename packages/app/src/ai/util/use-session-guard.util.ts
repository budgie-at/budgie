import { useCallback, useRef } from 'react';

interface SessionGuard {
    startNewSession: () => number;
    isCurrentSession: (sessionId: number) => boolean;
    getCurrentSessionId: () => number;
}

export const useSessionGuard = (): SessionGuard => {
    const sessionIdRef = useRef(0);

    const startNewSession = useCallback(() => {
        sessionIdRef.current += 1;

        return sessionIdRef.current;
    }, []);

    const isCurrentSession = useCallback((sessionId: number) => sessionIdRef.current === sessionId, []);

    const getCurrentSessionId = useCallback(() => sessionIdRef.current, []);

    return { startNewSession, isCurrentSession, getCurrentSessionId };
};
