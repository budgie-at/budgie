import { useRef } from 'react';

interface SessionGuard {
    startNewSession: () => number;
    isCurrentSession: (sessionId: number) => boolean;
    getCurrentSessionId: () => number;
}

export const useSessionGuard = (): SessionGuard => {
    const sessionIdRef = useRef(0);

    const startNewSession = () => {
        sessionIdRef.current += 1;

        return sessionIdRef.current;
    };

    const isCurrentSession = (sessionId: number) => sessionIdRef.current === sessionId;

    const getCurrentSessionId = () => sessionIdRef.current;

    return { startNewSession, isCurrentSession, getCurrentSessionId };
};
