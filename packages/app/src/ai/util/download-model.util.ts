/* eslint-disable lingui/no-unlocalized-strings -- Internal error message, not user-facing */
import { File, Paths } from 'expo-file-system';
import { createDownloadResumable } from 'expo-file-system/legacy';

import { isDefined } from '@rnw-community/shared';

export const downloadModel = async (url: string, filename: string, onProgress: (downloadProgress: number) => void): Promise<string> => {
    const destPath = `${Paths.document.uri}${filename}`;
    const destFile = new File(destPath);

    if (destFile.exists) {
        onProgress(1);

        return destPath;
    }

    const download = createDownloadResumable(url, destPath, {}, progress => {
        onProgress(progress.totalBytesWritten / progress.totalBytesExpectedToWrite);
    });

    const result = await download.downloadAsync();
    if (!isDefined(result?.uri)) {
        throw new Error('Model download failed');
    }

    return result.uri;
};
