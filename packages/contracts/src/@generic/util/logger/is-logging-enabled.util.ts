let provider: () => boolean = () => true;

export const setLoggingEnabledProvider = (fn: () => boolean): void => {
    provider = fn;
};

export const isLoggingEnabled = (): boolean => provider();
