import type { StatusToneType } from '../type/status-tone.type';

export const STATUS_TONE_FILL_CLASS_NAME: Record<StatusToneType, string> = {
    positive: 'bg-positive-foreground',
    warning: 'bg-warning-foreground',
    destructive: 'bg-destructive-foreground'
};
