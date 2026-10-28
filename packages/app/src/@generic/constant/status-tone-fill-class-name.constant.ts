import type { StatusToneType } from '../type/status-tone.type';

export const STATUS_TONE_FILL_CLASS_NAME: Record<StatusToneType, string> = {
    positive: 'bg-positive-fill',
    warning: 'bg-warning-fill',
    destructive: 'bg-destructive-fill'
};
