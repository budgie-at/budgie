import { AiSystemStateEnum } from '../enum/ai-system-state.enum';

interface StateVisualInterface {
    readonly colorClass: string;
    readonly stripClass: string;
    readonly pulsePeriodMs: number | null;
    readonly shakeOnEnter: boolean;
    readonly glow: boolean;
}

export const AI_SYSTEM_STATE_VISUALS: Record<AiSystemStateEnum, StateVisualInterface> = {
    [AiSystemStateEnum.DISABLED]: {
        colorClass: 'text-muted-foreground',
        stripClass: 'bg-muted-foreground',
        pulsePeriodMs: null,
        shakeOnEnter: false,
        glow: false
    },
    [AiSystemStateEnum.BOOTING]: {
        colorClass: 'text-primary-foreground',
        stripClass: 'bg-primary-foreground',
        pulsePeriodMs: 1200,
        shakeOnEnter: false,
        glow: false
    },
    [AiSystemStateEnum.SUSPENDED]: {
        colorClass: 'text-warning-foreground',
        stripClass: 'bg-warning-foreground',
        pulsePeriodMs: 1200,
        shakeOnEnter: false,
        glow: false
    },
    [AiSystemStateEnum.IDLE]: {
        colorClass: 'text-muted-foreground',
        stripClass: 'bg-muted-foreground',
        pulsePeriodMs: null,
        shakeOnEnter: false,
        glow: false
    },
    [AiSystemStateEnum.TRANSLATING]: {
        colorClass: 'text-warning-foreground',
        stripClass: 'bg-warning-foreground',
        pulsePeriodMs: 1000,
        shakeOnEnter: false,
        glow: false
    },
    [AiSystemStateEnum.INDEXING]: {
        colorClass: 'text-primary-foreground',
        stripClass: 'bg-primary-foreground',
        pulsePeriodMs: 700,
        shakeOnEnter: false,
        glow: false
    },
    [AiSystemStateEnum.BOOSTING]: {
        colorClass: 'text-positive-foreground',
        stripClass: 'bg-positive-foreground',
        pulsePeriodMs: 800,
        shakeOnEnter: false,
        glow: true
    },
    [AiSystemStateEnum.READY]: {
        colorClass: 'text-positive-foreground',
        stripClass: 'bg-positive-foreground',
        pulsePeriodMs: null,
        shakeOnEnter: false,
        glow: false
    },
    [AiSystemStateEnum.ERROR]: {
        colorClass: 'text-destructive-foreground',
        stripClass: 'bg-destructive-foreground',
        pulsePeriodMs: null,
        shakeOnEnter: true,
        glow: false
    }
};
