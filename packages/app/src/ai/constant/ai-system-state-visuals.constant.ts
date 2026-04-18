import { UserIconNameEnum } from '@budgie/contracts';

import { AiSystemActionEnum } from '../enum/ai-system-action.enum';
import { AiSystemStateEnum } from '../enum/ai-system-state.enum';

interface StateVisualInterface {
    readonly colorClass: string;
    readonly stripClass: string;
    readonly pulsePeriodMs: number | null;
    readonly shakeOnEnter: boolean;
    readonly glow: boolean;
}

interface ActionVisualInterface {
    readonly icon: UserIconNameEnum | null;
    readonly accessibilityHint: string;
}

export const AI_SYSTEM_STATE_VISUALS: Record<AiSystemStateEnum, StateVisualInterface> = {
    [AiSystemStateEnum.Disabled]: {
        colorClass: 'text-muted-foreground',
        stripClass: 'bg-muted-foreground',
        pulsePeriodMs: null,
        shakeOnEnter: false,
        glow: false
    },
    [AiSystemStateEnum.Booting]: {
        colorClass: 'text-primary-foreground',
        stripClass: 'bg-primary-foreground',
        pulsePeriodMs: 1200,
        shakeOnEnter: false,
        glow: false
    },
    [AiSystemStateEnum.Translating]: {
        colorClass: 'text-warning-foreground',
        stripClass: 'bg-warning-foreground',
        pulsePeriodMs: 1000,
        shakeOnEnter: false,
        glow: false
    },
    [AiSystemStateEnum.Indexing]: {
        colorClass: 'text-primary-foreground',
        stripClass: 'bg-primary-foreground',
        pulsePeriodMs: 700,
        shakeOnEnter: false,
        glow: false
    },
    [AiSystemStateEnum.Boosting]: {
        colorClass: 'text-positive-foreground',
        stripClass: 'bg-positive-foreground',
        pulsePeriodMs: 400,
        shakeOnEnter: false,
        glow: true
    },
    [AiSystemStateEnum.Ready]: {
        colorClass: 'text-positive-foreground',
        stripClass: 'bg-positive-foreground',
        pulsePeriodMs: null,
        shakeOnEnter: false,
        glow: false
    },
    [AiSystemStateEnum.Error]: {
        colorClass: 'text-destructive-foreground',
        stripClass: 'bg-destructive-foreground',
        pulsePeriodMs: null,
        shakeOnEnter: true,
        glow: false
    }
};

export const AI_SYSTEM_ACTION_VISUALS: Record<AiSystemActionEnum, ActionVisualInterface> = {
    [AiSystemActionEnum.None]: { icon: null, accessibilityHint: '' },
    [AiSystemActionEnum.Boost]: { icon: UserIconNameEnum.Bolt, accessibilityHint: 'Double tap to speed up indexing' },
    [AiSystemActionEnum.Cancel]: { icon: UserIconNameEnum.Pause, accessibilityHint: 'Double tap to cancel boost' },
    [AiSystemActionEnum.Retry]: { icon: UserIconNameEnum.RotateCw, accessibilityHint: 'Double tap to retry' }
};
