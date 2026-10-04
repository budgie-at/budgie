const normalizePart = (value: number | string) =>
    value
        .toString()
        .replaceAll(/[-−]/gu, 'minus_')
        .replaceAll(/[^a-zA-Z0-9]+/gu, '_');

export const RunwaySelector = {
    Pill: 'RunwayPill',
    VerdictCryptoNote: 'RunwayVerdict.CryptoNote',
    VerdictFigure: (value: number | string) => `RunwayVerdict.Figure.${normalizePart(value)}` as const,
    FlowRow: 'RunwayFlowRow',
    Drivers: 'RunwayDrivers'
} as const;
