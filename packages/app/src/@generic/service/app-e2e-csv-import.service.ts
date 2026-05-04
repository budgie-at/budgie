import { Log } from '@budgie/logger';
import { File, Paths } from 'expo-file-system';

import { getErrorMessage } from '@rnw-community/shared';

/* eslint-disable lingui/no-unlocalized-strings */
class AppE2ECsvImportService {
    @Log(
        displayName => `enter displayName="${displayName}"`,
        (result, displayName) => `done displayName="${displayName}" uri="${result}"`,
        (error, displayName) => `throw displayName="${displayName}" error=${getErrorMessage(error)}`
    )
    getCsvFixtureUri(displayName: string): string {
        const file = new File(Paths.document, 'E2ECsvFixtures', `${displayName}.csv`);

        return file.uri;
    }
}

export const appE2ECsvImportService = new AppE2ECsvImportService();
