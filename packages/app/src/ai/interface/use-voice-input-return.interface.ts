import { AITransactionInterface } from '@budgie/ai';

import { VoiceInputStateEnum } from '../enum/voice-input-state.enum';

import { VoiceInputDataInterface } from './voice-input-data.interface';

import type { AppServices } from '../../@generic/runtime/app.runtime';
import type * as Effect from 'effect/Effect';

export interface UseVoiceInputReturnInterface {
    readonly state: VoiceInputStateEnum;
    readonly data: VoiceInputDataInterface;
    readonly isReady: boolean;
    readonly downloadProgress: number;
    readonly startAndCollect: (
        onResult: (transactions: AITransactionInterface[], originalText: string) => void
    ) => Effect.Effect<void, unknown, AppServices>;
    readonly stop: () => void;
    readonly cancel: () => void;
}
