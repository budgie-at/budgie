import { isDefined } from '@rnw-community/shared';

import type { ChartSwatchInterface } from '../interface/chart-swatch.interface';

const CHART_PALETTE: readonly ChartSwatchInterface[] = [
    { fill: 'bg-chart-1', soft: 'bg-chart-1/15', text: 'text-chart-1' },
    { fill: 'bg-chart-2', soft: 'bg-chart-2/15', text: 'text-chart-2' },
    { fill: 'bg-chart-3', soft: 'bg-chart-3/15', text: 'text-chart-3' },
    { fill: 'bg-chart-4', soft: 'bg-chart-4/15', text: 'text-chart-4' },
    { fill: 'bg-chart-5', soft: 'bg-chart-5/15', text: 'text-chart-5' },
    { fill: 'bg-chart-6', soft: 'bg-chart-6/15', text: 'text-chart-6' }
];

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
