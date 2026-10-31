const LABEL_GAP = 9;
const LIMIT_CLEARANCE = 2;

export const resolveBudgetForecastEndLabelY = (pointY: number, limitY: number, fontSize: number, bottom: number): number => {
    const aboveY = pointY - LABEL_GAP;
    const isAboveLimit = pointY < limitY;
    const isClearOfLimit = aboveY - fontSize > limitY + LIMIT_CLEARANCE;

    if (isAboveLimit || isClearOfLimit) {
        return Math.max(aboveY, fontSize);
    }

    return Math.min(pointY + fontSize + LABEL_GAP, bottom);
};
