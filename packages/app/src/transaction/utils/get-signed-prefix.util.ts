export const getSignedPrefix = (value: number): string => {
    if (value > 0) {
        return '+';
    }

    return value < 0 ? '−' : '';
};
