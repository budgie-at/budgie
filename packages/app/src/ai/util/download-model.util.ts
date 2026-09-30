/* oxlint-disable lingui/no-unlocalized-strings -- Internal error message, not user-facing */
import * as Effect from 'effect/Effect';
import { File, Paths } from 'expo-file-system';
import { createDownloadResumable } from 'expo-file-system/legacy';

import { isDefined } from '@rnw-community/shared';

export const downloadModel = Effect.fn('downloadModel')(function* (
    url: string,
    filename: string,
    onProgress: (downloadProgress: number) => void
) {
    const destPath = `${Paths.document.uri}${filename}`;

    if (new File(destPath).exists) {
        onProgress(1);

        return destPath;
    }

    const download = createDownloadResumable(url, destPath, {}, progress => {
        onProgress(progress.totalBytesWritten / progress.totalBytesExpectedToWrite);
    });

    const result = yield* Effect.promise(() => download.downloadAsync());
    if (!isDefined(result?.uri)) {
        return yield* Effect.die(new Error('Model download failed'));
    }

    return result.uri;
});
