import { useRef, useState } from 'react';

export const useSingleFlight = () => {
    const isInFlightRef = useRef(false);
    const [isLoading, setIsLoading] = useState(false);

    const run = async <T>(action: () => Promise<T>): Promise<T | undefined> => {
        if (isInFlightRef.current) {
            return;
        }

        isInFlightRef.current = true;
        setIsLoading(true);

        try {
            return await action();
        } finally {
            isInFlightRef.current = false;
            setIsLoading(false);
        }
    };

    return { isLoading, run };
};
