import { RUNWAY_MAX_MONTHS } from '@budgie/contracts';

export const RUNWAY_FORECAST_HORIZONS_MONTHS = [0, 3, 6, 9, RUNWAY_MAX_MONTHS] as const;

export const RUNWAY_HORIZON_MONTHS = [3, 6, 9, RUNWAY_MAX_MONTHS] as const;
