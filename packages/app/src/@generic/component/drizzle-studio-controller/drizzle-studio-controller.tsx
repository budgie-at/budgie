import { useDrizzleStudio } from 'expo-drizzle-studio-plugin';
import { useSQLiteContext } from 'expo-sqlite';

export const DrizzleStudioController = () => {
    const db = useSQLiteContext();

    useDrizzleStudio(db);

    return null;
};
