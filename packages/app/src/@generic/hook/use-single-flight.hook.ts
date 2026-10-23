import { useRef, useState } from 'react';

export const useSingleFlight = () => {
    const isInFlightRef = useRef(false);
    const [isLoading, setIsLoading] = useState(false);

    const run = <T>(action: () => Promise<T>): Promise<T | null> => {
        if (isInFlightRef.current) {
            return Promise.resolve(null);
        }

        isInFlightRef.current = true;
        setIsLoading(true);

        return action().finally(() => {
            isInFlightRef.current = false;
            setIsLoading(false);
        });
    };

    return { isLoading, run };
};
