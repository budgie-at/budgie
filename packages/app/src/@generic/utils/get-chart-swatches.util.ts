import { isDefined } from '@rnw-community/shared';

import { CHART_PALETTE } from '../constant/chart-palette.constant';

import type { ChartSwatchInterface } from '../interface/chart-swatch.interface';

export const getChartSwatches = (entityIds: readonly (number | null)[]): (ChartSwatchInterface | null)[] => {
    const usedIndexes = new Set<number>();

    return entityIds.map(entityId => {
        if (!isDefined(entityId)) {
            return null;
        }

        const preferredIndex = entityId % CHART_PALETTE.length;
        const freeIndex = CHART_PALETTE.map((_, offset) => (preferredIndex + offset) % CHART_PALETTE.length).find(
            index => !usedIndexes.has(index)
        );

        if (!isDefined(freeIndex)) {
            return null;
        }

        usedIndexes.add(freeIndex);

        return CHART_PALETTE[freeIndex];
    });
};
