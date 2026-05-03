import { t } from '@lingui/core/macro';

import { isDefined } from '@rnw-community/shared';

import { STT_BEAM_SIZE, STT_MAX_THREADS, STT_MAX_TRANSCRIPTION_LEN, STT_TEMPERATURE } from '../constant/stt-realtime-options.constant';

import type { TranscribeOptions } from 'whisper.rn';

export const buildSttTranscribeOptions = (language: string | null): TranscribeOptions => ({
    ...(isDefined(language) && { language }),
    ...(language === 'uk' && { prompt: t`Коротка витрата українською. Приклади: ресторан 200 євро, кава 5 євро, таксі 12 євро.` }),
    maxThreads: STT_MAX_THREADS,
    temperature: STT_TEMPERATURE,
    temperatureInc: STT_TEMPERATURE,
    maxLen: STT_MAX_TRANSCRIPTION_LEN,
    beamSize: STT_BEAM_SIZE,
    bestOf: STT_BEAM_SIZE
});
