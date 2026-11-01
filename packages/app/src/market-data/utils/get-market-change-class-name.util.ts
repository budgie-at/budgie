export const getMarketChangeClassName = (value: number): string => {
    if (value > 0) {
        return 'text-positive-foreground';
    }

    return value < 0 ? 'text-destructive-foreground' : 'text-primary';
};
