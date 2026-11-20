import { isDefined } from '@rnw-community/shared';

const LABEL_HEIGHT = 14;
const LABEL_GAP = 4;

const clampTop = (top: number, plotHeight: number): number => Math.min(Math.max(top, 0), plotHeight - LABEL_HEIGHT);

export const resolveYieldRunningLabelTops = (endY: number, priorEndY: number | null, plotHeight: number) => {
    const aboveTop = (y: number) => y - LABEL_HEIGHT - LABEL_GAP;
    const belowTop = (y: number) => y + LABEL_GAP;
    const priorY = priorEndY ?? 0;
    const isCurrentAbove = !isDefined(priorEndY) || endY <= priorY;
    const endTop = isCurrentAbove && aboveTop(endY) >= 0 ? aboveTop(endY) : belowTop(endY);
    const priorTop = isCurrentAbove || aboveTop(priorY) < 0 ? belowTop(priorY) : aboveTop(priorY);

    return { endStyle: { top: clampTop(endTop, plotHeight), right: 0 }, priorStyle: { top: clampTop(priorTop, plotHeight), right: 0 } };
};
