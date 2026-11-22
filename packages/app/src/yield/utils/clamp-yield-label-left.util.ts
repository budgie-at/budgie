export const clampYieldLabelLeft = (centre: number, labelWidth: number, plotLeft: number, plotRight: number): number => {
    const centred = centre - labelWidth / 2;
    const maxLeft = Math.max(plotRight - labelWidth, plotLeft);

    return Math.min(Math.max(centred, plotLeft), maxLeft);
};
