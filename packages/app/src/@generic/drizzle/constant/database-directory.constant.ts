import { Directory, Paths } from 'expo-file-system';

export const DATABASE_DIRECTORY = new Directory(Paths.document, 'SQLite');
