import * as Effect from 'effect/Effect';
import { File, Paths } from 'expo-file-system';

import { isDefined } from '@rnw-community/shared';

import { downloadVerifiedFile } from '../utils/download-verified-file.util';

export const downloadModel = Effect.fn('downloadModel')(function* (
    url: string,
    filename: string,
    onProgress: (downloadProgress: number) => void
) {
    const destFile = new File(Paths.document, filename);
    const sizeFile = new File(Paths.document, `${filename}.size`);

    if (destFile.exists && sizeFile.exists && sizeFile.textSync() === String(destFile.size)) {
        onProgress(1);

        return destFile.uri;
    }

    const tempFile = new File(Paths.document, `${filename}.download`);
    const deleteFiles = (...files: File[]) =>
        Effect.sync(() => {
            for (const file of files) {
                if (file.exists) {
                    file.delete();
                }
            }
        });

    yield* deleteFiles(tempFile, destFile, sizeFile);

    yield* Effect.gen(function* () {
        const downloadedBytes = yield* downloadVerifiedFile(url, tempFile, (bytesWritten, expectedBytes) => {
            onProgress(bytesWritten / expectedBytes);
        });

        if (!isDefined(downloadedBytes)) {
            return yield* Effect.die(new Error('Model download failed'));
        }

        yield* Effect.promise(() => tempFile.move(destFile));
        sizeFile.writeSync(String(downloadedBytes));
    }).pipe(Effect.onError(() => deleteFiles(tempFile)));

    return destFile.uri;
});
