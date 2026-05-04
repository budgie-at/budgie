import { AITransactionInterface } from '@budgie/ai';

import { VoiceInputStateEnum } from '../enum/voice-input-state.enum';

import { VoiceInputDataInterface } from './voice-input-data.interface';

export interface UseVoiceInputReturnInterface {
    readonly state: VoiceInputStateEnum;
    readonly data: VoiceInputDataInterface;
    readonly isReady: boolean;
    readonly downloadProgress: number;
    readonly startAndCollect: (onResult: (transactions: AITransactionInterface[], originalText: string) => void) => void;
    readonly stop: () => void;
    readonly cancel: () => void;
}
