import { AiSubsystemCardStateEnum } from '../enum/ai-subsystem-card-state.enum';

interface SubsystemCardVisualInterface {
    readonly colorClass: string;
    readonly pulsePeriodMs: number | null;
    readonly glow: boolean;
}

export const AI_SUBSYSTEM_CARD_VISUALS: Record<AiSubsystemCardStateEnum, SubsystemCardVisualInterface> = {
    [AiSubsystemCardStateEnum.Hidden]: {
        colorClass: 'text-muted-foreground',
        pulsePeriodMs: null,
        glow: false
    },
    [AiSubsystemCardStateEnum.Ready]: {
        colorClass: 'text-positive-foreground',
        pulsePeriodMs: null,
        glow: false
    },
    [AiSubsystemCardStateEnum.Working]: {
        colorClass: 'text-warning-foreground',
        pulsePeriodMs: 1000,
        glow: false
    },
    [AiSubsystemCardStateEnum.Boosting]: {
        colorClass: 'text-positive-foreground',
        pulsePeriodMs: 800,
        glow: true
    },
    [AiSubsystemCardStateEnum.Error]: {
        colorClass: 'text-destructive-foreground',
        pulsePeriodMs: null,
        glow: false
    }
};
