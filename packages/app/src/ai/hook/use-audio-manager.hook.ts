import { useEffect } from 'react';
import { AudioManager } from 'react-native-audio-api';

export const useAudioManager = () => {
    useEffect(() => {
        const setup = async () => {
            await AudioManager.requestRecordingPermissions();
            AudioManager.setAudioSessionOptions({
                iosCategory: 'playAndRecord',
                iosMode: 'spokenAudio',
                iosOptions: ['defaultToSpeaker', 'allowBluetoothA2DP']
            });
        };

        void setup();
    }, []);
};
