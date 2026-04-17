import { AiModeEnum } from '../enum/ai-mode.enum';

export interface AiStateInterface {
    readonly mode: AiModeEnum;
    readonly initGeneration: number;
}

export type AiActionType =
    | { readonly type: 'mount-disabled' }
    | { readonly type: 'mount-suspended' }
    | { readonly type: 'init-start' }
    | { readonly type: 'init-success' }
    | { readonly type: 'init-fail' }
    | { readonly type: 'resume' }
    | { readonly type: 'suspend' }
    | { readonly type: 'retry' };

export const getInitialAiState = (enabled: boolean): AiStateInterface => ({
    mode: enabled ? AiModeEnum.Initializing : AiModeEnum.Disabled,
    initGeneration: 0
});

export const aiModeReducer = (state: AiStateInterface, action: AiActionType): AiStateInterface => {
    switch (action.type) {
        case 'mount-disabled':
            return { ...state, mode: AiModeEnum.Disabled };
        case 'mount-suspended':
            return { ...state, mode: AiModeEnum.Suspended };
        case 'init-start':
            return { ...state, mode: AiModeEnum.Initializing };
        case 'init-success':
            return { ...state, mode: AiModeEnum.Ready };
        case 'init-fail':
            return { ...state, mode: AiModeEnum.Error };
        case 'resume':
            if (state.mode !== AiModeEnum.Suspended) {
                return state;
            }

            return { mode: AiModeEnum.Initializing, initGeneration: state.initGeneration + 1 };
        case 'suspend':
            return { ...state, mode: AiModeEnum.Suspended };
        case 'retry':
            return { mode: AiModeEnum.Initializing, initGeneration: state.initGeneration + 1 };
        default:
            return state;
    }
};
