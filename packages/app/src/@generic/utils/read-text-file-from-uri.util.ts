import { File } from 'expo-file-system';

export const readTextFileFromUri = async (uri: string): Promise<string> => new File(uri).text();
