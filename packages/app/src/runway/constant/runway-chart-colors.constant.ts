export const RUNWAY_CHART_COLORS = {
    positive: '#00ff88',
    destructive: '#ff4444',
    warning: '#f0b100',
    median: '#ffffff',
    bandFill: 'rgba(255, 68, 68, 0.10)',
    bandStroke: 'rgba(255, 68, 68, 0.28)',
    zero: '#333333',
    grid: '#1c1c1c',
    label: '#666666',
    markerBackground: '#0a0a0a'
} as const;

export const RUNWAY_METER_POSITIVE_STOPS = [
    { offset: '0%', color: '#7ddb4f' },
    { offset: '100%', color: '#00ff88' }
] as const;

export const RUNWAY_METER_NEGATIVE_STOPS = [
    { offset: '0%', color: '#00ff88' },
    { offset: '45%', color: '#7ddb4f' },
    { offset: '78%', color: '#f0b100' },
    { offset: '100%', color: '#ff8a00' }
] as const;
