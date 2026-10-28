const BAR_RADIUS = 3;

export const buildBudgetHistoryBarPath = (x: number, baselineY: number, width: number, height: number): string => {
    const cornerRadius = Math.min(BAR_RADIUS, height, width / 2);
    const top = baselineY - height;
    const right = x + width;

    return [
        'M',
        x,
        baselineY,
        'L',
        x,
        top + cornerRadius,
        'Q',
        x,
        top,
        x + cornerRadius,
        top,
        'L',
        right - cornerRadius,
        top,
        'Q',
        right,
        top,
        right,
        top + cornerRadius,
        'L',
        right,
        baselineY,
        'Z'
    ].join(' ');
};
