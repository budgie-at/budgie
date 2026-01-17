import { light } from '../../../theme/provider/theme.provider';

export const BUTTON_SIZE = 80;
export const RING_SIZE = 120;
export const STROKE_WIDTH = 3;

export const ACCENT_COLOR = light['--color-default-foreground'];
export const RECORDING_COLOR = light['--color-destructive-foreground'];
export const THINKING_COLOR = light['--color-default-foreground'];
export const LOADING_COLOR = light['--color-secondary-foreground'];
export const CONFIRM_COLOR = light['--color-positive-foreground'];

export const RING_CENTER = RING_SIZE / 2;
export const RING_RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
export const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
