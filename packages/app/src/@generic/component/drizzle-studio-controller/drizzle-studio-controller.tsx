import { useDrizzleStudio } from 'expo-drizzle-studio-plugin';

import { expoDb } from '../../drizzle/db/db';

export const DrizzleStudioController = () => {
    useDrizzleStudio(expoDb);

    return null;
};
