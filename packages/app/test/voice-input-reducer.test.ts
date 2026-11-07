import { describe, expect, it } from '@effect/vitest';

import { VoiceInputActionTypeEnum } from '../src/ai/enum/voice-input-action-type.enum';
import { VoiceInputStateEnum } from '../src/ai/enum/voice-input-state.enum';
import { VoiceInputReducerStateInterface } from '../src/ai/interface/voice-input-reducer-state.interface';
import { voiceInputReducer } from '../src/ai/utils/voice-input-reducer.util';

const stateWith = (status: VoiceInputStateEnum): VoiceInputReducerStateInterface => ({
    status,
    error: null,
    finalTranscription: '',
    hasBeenReady: true
});

describe('voiceInputReducer', () => {
    it('moves RECORDING to TRANSCRIBING once', () => {
        const first = voiceInputReducer(stateWith(VoiceInputStateEnum.RECORDING), { type: VoiceInputActionTypeEnum.TRANSCRIBING_STARTED });

        expect(first.status).toBe(VoiceInputStateEnum.TRANSCRIBING);
    });

    it.each([
        VoiceInputStateEnum.IDLE,
        VoiceInputStateEnum.TRANSCRIBING,
        VoiceInputStateEnum.PROCESSING,
        VoiceInputStateEnum.DONE,
        VoiceInputStateEnum.ERROR
    ])('ignores TRANSCRIBING_STARTED from %s', status => {
        const state = stateWith(status);

        expect(voiceInputReducer(state, { type: VoiceInputActionTypeEnum.TRANSCRIBING_STARTED })).toBe(state);
    });

    it('resets status when a new session starts', () => {
        const next = voiceInputReducer(
            { ...stateWith(VoiceInputStateEnum.DONE), finalTranscription: 'x' },
            { type: VoiceInputActionTypeEnum.SESSION_STARTED }
        );

        expect(next.status).toBe(VoiceInputStateEnum.IDLE);
        expect(next.finalTranscription).toBe('');
    });
});
