import { File, Paths } from 'expo-file-system';

/* eslint-disable lingui/no-unlocalized-strings */
class AppE2ECsvImportService {
    getCsvFixtureUri(displayName: string): string {
        const file = new File(Paths.document, 'E2ECsvFixtures', `${displayName}.csv`);

        return file.uri;
    }
}

export const appE2ECsvImportService = new AppE2ECsvImportService();
