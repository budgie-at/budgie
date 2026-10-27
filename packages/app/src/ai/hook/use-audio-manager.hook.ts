import * as Effect from 'effect/Effect';
import { useEffect } from 'react';
import { AudioManager } from 'react-native-audio-api';

import { appRuntime } from '../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../@generic/utils/log-and-continue.util';

const setup = Effect.promise(() => AudioManager.requestRecordingPermissions()).pipe(
    Effect.andThen(
        Effect.sync(
            () =>
                void AudioManager.setAudioSessionOptions({
                    iosCategory: 'playAndRecord',
                    iosMode: 'spokenAudio',
                    iosOptions: ['defaultToSpeaker', 'allowBluetoothA2DP']
                })
        )
    )
);

export const useAudioManager = () => {
    useEffect(() => void appRuntime.runFork(logAndContinue(setup)), []);
};
