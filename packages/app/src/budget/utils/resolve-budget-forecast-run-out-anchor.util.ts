const EDGE_RATIO = 0.18;

export const resolveBudgetForecastRunOutAnchor = (x: number, width: number) => {
    if (x > width * (1 - EDGE_RATIO)) {
        return 'end';
    }

    return x < width * EDGE_RATIO ? 'start' : 'middle';
};
