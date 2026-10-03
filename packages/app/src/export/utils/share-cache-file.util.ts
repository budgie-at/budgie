import { format } from 'date-fns/format';
import * as Effect from 'effect/Effect';
import { File, Paths } from 'expo-file-system';
import { isAvailableAsync, shareAsync } from 'expo-sharing';

import type { SharingOptions } from 'expo-sharing';

export const shareCacheFile = Effect.fn('shareCacheFile')(function* (
    fileNamePrefix: string,
    extension: string,
    writeFile: (file: File) => Effect.Effect<void>,
    sharingOptions: Pick<SharingOptions, 'mimeType' | 'UTI'>
) {
    const fileName = `${fileNamePrefix}-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.${extension}`;
    const file = new File(Paths.cache, fileName);

    if (file.exists) {
        file.delete();
    }

    yield* writeFile(file);

    if (yield* Effect.promise(() => isAvailableAsync())) {
        yield* Effect.promise(() => shareAsync(file.uri, { ...sharingOptions, dialogTitle: fileName }));
    }
});
