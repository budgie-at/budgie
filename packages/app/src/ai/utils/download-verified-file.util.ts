import * as Effect from 'effect/Effect';
import { createDownloadResumable } from 'expo-file-system/legacy';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import type { File } from 'expo-file-system';

export const downloadVerifiedFile = Effect.fn('downloadVerifiedFile')(function* (
    url: string,
    file: File,
    onProgress: (bytesWritten: number, expectedBytes: number) => void
) {
    let expectedBytes = 0;
    const download = createDownloadResumable(url, file.uri, {}, progress => {
        expectedBytes = progress.totalBytesExpectedToWrite;
        onProgress(progress.totalBytesWritten, expectedBytes);
    });
    const result = yield* Effect.promise(() => download.downloadAsync());

    return isDefined(result?.uri) && file.exists && isPositiveNumber(expectedBytes) && file.size === expectedBytes ? expectedBytes : null;
});
