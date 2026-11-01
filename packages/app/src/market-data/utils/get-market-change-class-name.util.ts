export const getMarketChangeClassName = (value: number): string => {
    if (value > 0) {
        return 'text-positive-strong';
    }

    return value < 0 ? 'text-destructive-strong' : 'text-primary';
};
