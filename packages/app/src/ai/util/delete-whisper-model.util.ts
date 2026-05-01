import { Directory, File, Paths } from 'expo-file-system';

import { WHISPER_MODEL_DIRECTORY, WHISPER_MODEL_FILENAME } from '../constant/whisper-model.constant';

export const deleteWhisperModel = (): void => {
    const modelDirectory = new Directory(Paths.document, WHISPER_MODEL_DIRECTORY);
    const modelFile = new File(modelDirectory, WHISPER_MODEL_FILENAME);

    if (modelFile.exists) {
        modelFile.delete();
    }
};
