import { AppState } from 'react-native';

import { AiModeEnum } from '../enum/ai-mode.enum';

export const isNativeCallSafe = (mode: AiModeEnum): boolean =>
    AppState.currentState === 'active' && mode === AiModeEnum.Ready;
