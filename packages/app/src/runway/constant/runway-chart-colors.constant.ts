import { ColorSchemaEnum } from '../../theme/enum/color-schema.enum';

import type { RunwayChartColorsInterface } from '../interface/runway-chart-colors.interface';

export const RUNWAY_CHART_COLORS: Record<ColorSchemaEnum, RunwayChartColorsInterface> = {
    [ColorSchemaEnum.Light]: {
        destructive: 'rgba(239, 68, 68, 1)',
        median: 'rgba(0, 0, 0, 1)',
        bandFill: 'rgba(10, 10, 10, 0.05)',
        bandStroke: 'rgba(0, 0, 0, 0.2)',
        zero: 'rgba(229, 229, 229, 1)',
        label: 'rgba(115, 115, 115, 1)',
        markerBackground: 'rgba(255, 255, 255, 1)'
    },
    [ColorSchemaEnum.Dark]: {
        destructive: 'rgba(255, 68, 68, 1)',
        median: 'rgba(255, 255, 255, 1)',
        bandFill: 'rgba(255, 255, 255, 0.05)',
        bandStroke: 'rgba(255, 255, 255, 0.2)',
        zero: 'rgba(34, 34, 34, 1)',
        label: 'rgba(136, 136, 136, 1)',
        markerBackground: 'rgba(10, 10, 10, 1)'
    }
};

export const RUNWAY_METER_STOPS = [
    { offset: '0%', color: '#00ff88' },
    { offset: '45%', color: '#7ddb4f' },
    { offset: '78%', color: '#f0b100' },
    { offset: '100%', color: '#ff8a00' }
] as const;
